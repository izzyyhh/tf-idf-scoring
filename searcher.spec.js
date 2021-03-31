import glob from "glob";
import Searcher from "./searcher";

describe("Searcher", () => {
    let searcher;

    beforeAll(() => {
        searcher = new Searcher(glob.sync("corpus/*.txt"), true);
    });

    function expectSearchResultsFor(query) {
        return expect(searcher.search(query));
    }

    function expectTop5SearchResultsFor(query) {
        return expect(searcher.search(query).slice(0, 5));
    }

    it("finds one word", () => {
        expectSearchResultsFor("salzburg").toHaveLength(28);
        expectTop5SearchResultsFor("salzburg").toEqual([
            {
                filename: "Archbishopric_of_Salzburg.txt",
                score: 39614.142857142855,
                terms: { salzburg: 39614.142857142855 }
            },
            {
                filename: "Herbert_von_Karajan.txt",
                score: 10803.857142857143,
                terms: { salzburg: 10803.857142857143 }
            },
            {
                filename: "Wolfgang_Amadeus_Mozart.txt",
                score: 10803.857142857143,
                terms: { salzburg: 10803.857142857143 }
            },
            {
                filename: "Alfons_Schuhbeck.txt",
                score: 3601.285714285714,
                terms: { salzburg: 3601.285714285714 }
            },
            {
                filename: "Carl_Maria_von_Weber.txt",
                score: 3601.285714285714,
                terms: { salzburg: 3601.285714285714 }
            }
        ]);
    });

    it("finds two words", () => {
        expectSearchResultsFor("austria germany").toHaveLength(1694);
        expectTop5SearchResultsFor("austria germany").toEqual([
            {
                filename: "Austria.txt",
                score: 3820.0949838142933,
                terms: {
                    austria: 3754.531914893617,
                    germany: 65.5630689206762
                }
            },
            {
                filename: "Anschluss.txt",
                score: 3739.6523531527546,
                terms: {
                    austria: 3575.744680851064,
                    germany: 163.9076723016905
                }
            },
            {
                filename: "Treaty_of_Versailles.txt",
                score: 2607.4107019339845,
                terms: {
                    austria: 1787.872340425532,
                    germany: 819.5383615084526
                }
            },
            {
                filename: "Germany.txt",
                score: 2583.6964004094843,
                terms: {
                    austria: 715.1489361702128,
                    germany: 1868.5474642392717
                }
            },
            {
                filename: "Prussia.txt",
                score: 1808.7967241236202,
                terms: {
                    austria: 1251.5106382978724,
                    germany: 557.2860858257477
                }
            }
        ]);
    });

    it("sorts results with same score alphabetically descending", () => {
        expectTop5SearchResultsFor("blueprint").toEqual([
            {
                filename: "RNA.txt",
                score: 25209,
                terms: {
                    blueprint: 25209
                }
            },
            {
                filename: "_03_Bonnie_Clyde.txt",
                score: 25209,
                terms: {
                    blueprint: 25209
                }
            }
        ]);
    });

    it("ignores order of search terms", () => {
        const expectedFilenames1 = searcher.search("austria germany").map(result => result.filename);
        const expectedFilenames2 = searcher.search("germany austria").map(result => result.filename);
        expect(expectedFilenames1).toEqual(expectedFilenames2);
    });

    test("returns empty result when single word is not found", () => {
        expectSearchResultsFor("blubbergurken").toEqual([]);
    });

    test("ignores unknown words", () => {
        const expectedResults = searcher.search("salzburg");
        expectSearchResultsFor("salzburg blubbergurken").toEqual(expectedResults);
        expectSearchResultsFor("blubbergurken salzburg").toEqual(expectedResults);
    });

    test("returns all documents for empty search", () => {
        expectSearchResultsFor("").toHaveLength(50418);
    });
});
