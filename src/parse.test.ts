import { expect, test } from "vitest";
import { tokenize } from "./tokenize";
import { Parser } from "./parse";

test("parses sumti", () => {
	const tokens = tokenize("lo gerku ku");
	const parser = new Parser(tokens);
	const bridi = parser.parseSumti();
	expect(bridi).toMatchInlineSnapshot(`
		{
		  "end": {
		    "column": [
		      10,
		      11,
		    ],
		    "lexeme": "ku",
		    "line": 1,
		    "selmaho": "BRIVLA",
		    "sourceText": "ku",
		  },
		  "start": {
		    "column": [
		      1,
		      2,
		    ],
		    "lexeme": "lo",
		    "line": 1,
		    "selmaho": "LE",
		    "sourceText": "lo",
		  },
		  "terminator": undefined,
		  "type": "sumti",
		}
	`);
});

test("parses bridi", () => {
	const tokens = tokenize("mi kurji lo gerku");
	const parser = new Parser(tokens);
	const bridi = parser.parseBridi();
	expect(bridi).toMatchInlineSnapshot(`
		{
		  "end": 3,
		  "head": [],
		  "selbri": {
		    "end": 1,
		    "start": 0,
		    "type": "selbri",
		    "units": [
		      {
		        "end": 0,
		        "start": 0,
		        "type": "brivla",
		      },
		      {
		        "end": 1,
		        "start": 1,
		        "type": "brivla",
		      },
		    ],
		  },
		  "start": 0,
		  "tail": [
		    {
		      "end": 3,
		      "start": 2,
		      "terminator": undefined,
		      "type": "sumti",
		    },
		  ],
		  "type": "bridi",
		}
	`);
})