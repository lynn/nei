import { expect, test } from "vitest";
import { Tokenizer } from "./tokenize";

test("tokenizer", () => {
	expect(
		new Tokenizer({
			cmevlaBrivlaMerger: false,
		}).tokenize(".i mi ti zei nelci\nlenu clire si cilre"),
	).toMatchInlineSnapshot(`
		[
		  {
		    "column": [
		      1,
		      2,
		    ],
		    "erased": [],
		    "index": 0,
		    "indicators": [],
		    "lexeme": "i",
		    "line": 1,
		    "selmaho": "I",
		    "sourceText": ".i",
		  },
		  {
		    "column": [
		      4,
		      5,
		    ],
		    "erased": [],
		    "index": 1,
		    "indicators": [],
		    "lexeme": "mi",
		    "line": 1,
		    "selmaho": "KOhA",
		    "sourceText": "mi",
		  },
		  {
		    "column": [
		      7,
		      18,
		    ],
		    "erased": [],
		    "index": 2,
		    "indicators": [],
		    "lexeme": "ti zei nelci",
		    "line": 1,
		    "selmaho": "BRIVLA",
		    "sourceText": "ti zei nelci",
		  },
		  {
		    "column": [
		      1,
		      2,
		    ],
		    "erased": [],
		    "index": 3,
		    "indicators": [],
		    "lexeme": "le",
		    "line": 2,
		    "selmaho": "LE",
		    "sourceText": "le",
		  },
		  {
		    "column": [
		      3,
		      4,
		    ],
		    "erased": [],
		    "index": 4,
		    "indicators": [],
		    "lexeme": "nu",
		    "line": 2,
		    "selmaho": "NU",
		    "sourceText": "nu",
		  },
		  {
		    "column": [
		      15,
		      19,
		    ],
		    "erased": [
		      "clire",
		      "si",
		    ],
		    "index": 5,
		    "indicators": [],
		    "lexeme": "cilre",
		    "line": 2,
		    "selmaho": "BRIVLA",
		    "sourceText": "cilre",
		  },
		]
	`);
});
