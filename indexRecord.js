export default class IndexRecord {
    constructor(file) {
        // starting with as term occurred once already
        // an associative array is used to store document specific information, freq
        this.freqs = [];
        this.freqs[file] = 1;
        this.tf = 1;
    }
    // increment tf but also document_tf
    increment(file) {
        this.tf++;

        if (this.freqs[file]) {
            this.freqs[file]++;
            return;
        }

        this.freqs[file] = 1;
    }

    getDocs() {
        return Object.keys(this.freqs);
    }

    getIDF(numDocs) {
        const docFreq = this.getDocs().length;

        return numDocs / docFreq;
    }
}
