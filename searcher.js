import fs from "fs";
import path from "path";
import stopwords from "./stopwords";
import IndexRecord from "./indexRecord";

export default class Searcher {
    constructor(files) {
        this.invertedIndex = this.getInvertedIndexFromFiles(files);
        this.files = files;
    }

    search(query) {
        // returns all documents if empty query
        if (query === "") return this.files.map(doc => ({ filename: path.basename(doc), score: 0, terms: {} }));

        const terms = this.termifyText(query);
        const result = [];

        // get all affected documents
        const docs = new Set();

        terms.forEach(term => {
            if (this.invertedIndex.has(term)) {
                const termDocs = this.invertedIndex.get(term).getDocs();
                termDocs.forEach(doc => docs.add(doc));
            }
        });

        // for each document, score is calculated and an object is pushed to the result array
        docs.forEach(doc => {
            const termsWithScore = {};
            let overallScore = 0;

            for (let term of terms) {
                // ignore unkown words by continuing
                if (!this.invertedIndex.has(term)) continue;

                const termScore = this.calculateScore(term, doc);
                termsWithScore[term] = termScore;
                overallScore += termScore;
            }

            result.push({ filename: path.basename(doc), score: overallScore, terms: termsWithScore });
        });

        // array is sorted by score, if score is same sort alphabetically ascending A->Z
        result.sort((a, b) => {
            if (a.score == b.score) {
                const aName = a.filename,
                    bName = b.filename;

                return bName > aName ? -1 : 1;
            }

            return b.score < a.score ? -1 : 1;
        });

        return result;
    }

    getInvertedIndexFromFiles(files) {
        try {
            const invertedIndex = new Map();

            files.forEach(file => {
                const documentText = fs.readFileSync(file, "utf-8");
                const terms = this.termifyText(documentText);

                terms.forEach(term => {
                    // if term is delimited by hyphen, add each term to the index, occured term is excluded
                    if (term.includes("-")) {
                        const delimitedTerms = term.split("-");
                        delimitedTerms.forEach(term => this.addTermToInvertedIndex(invertedIndex, term, file));
                    }
                    // always add the occurred term
                    this.addTermToInvertedIndex(invertedIndex, term, file);
                });
            });

            return invertedIndex;
        } catch (err) {
            console.error(err);
        }
    }

    addTermToInvertedIndex(invertedIndex, term, file) {
        if (invertedIndex.has(term)) {
            const postingList = invertedIndex.get(term);
            postingList.increment(file);
        } else {
            // a record which holds needed data is added to the index
            invertedIndex.set(term, new IndexRecord(file));
        }
    }

    termifyText(text) {
        const punctuationRegex = /[!"#$%&'()*+,./:;<=>?@[\]^_`{|}~]/g;
        const newLineRegex = /(\r\n|\n|\r)/gm;

        return text
            .replace(punctuationRegex, "")
            .replace(newLineRegex, " ")
            .toLowerCase()
            .split(" ")
            .filter(term => !stopwords.includes(term));
    }

    calculateScore(term, doc) {
        if (this.invertedIndex.has(term)) {
            const indexRecord = this.invertedIndex.get(term);
            const numDocs = this.files.length;
            const tfInDoc = indexRecord.freqs[doc] ? indexRecord.freqs[doc] : 0;

            return tfInDoc * indexRecord.getIDF(numDocs);
        }

        return 0;
    }
}
