import { expect, test } from "vitest";
import { Tokenizer } from "./tokenize";

test("tokenizer", () => {
	expect(
		new Tokenizer().tokenize(".i mi nelci\nlenu clire si cilre"),
	).toMatchInlineSnapshot(`
		[
		  {
		    "column": [
		      1,
		      2,
		    ],
		    "erased": [],
		    "index": 0,
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
		    "lexeme": "mi",
		    "line": 1,
		    "selmaho": "KOhA",
		    "sourceText": "mi",
		  },
		  {
		    "column": [
		      7,
		      11,
		    ],
		    "erased": [],
		    "index": 2,
		    "lexeme": "nelci",
		    "line": 1,
		    "selmaho": "BRIVLA",
		    "sourceText": "nelci",
		  },
		  {
		    "column": [
		      1,
		      2,
		    ],
		    "erased": [],
		    "index": 3,
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
		    "lexeme": "cilre",
		    "line": 2,
		    "selmaho": "BRIVLA",
		    "sourceText": "cilre",
		  },
		]
	`);
});
