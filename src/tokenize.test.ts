import { expect, test } from 'vitest'
import { tokenize } from "./tokenize";

test("tokenizer", () => {
    expect(tokenize(".i mi nelci\nlenu cilre")).toMatchInlineSnapshot(`
      [
        {
          "column": [
            1,
            2,
          ],
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
          "lexeme": "mi",
          "line": 1,
          "selmaho": "BRIVLA",
          "sourceText": "mi",
        },
        {
          "column": [
            7,
            11,
          ],
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
          "lexeme": "nu",
          "line": 2,
          "selmaho": "NU",
          "sourceText": "nu",
        },
        {
          "column": [
            6,
            10,
          ],
          "lexeme": "cilre",
          "line": 2,
          "selmaho": "BRIVLA",
          "sourceText": "cilre",
        },
      ]
    `);
});