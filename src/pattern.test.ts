import { describe, expect, it } from "vitest";
import {
	among,
	either,
	endOfStream,
	many,
	many1,
	matchesPattern,
	notAmong,
	opt,
	patternNumber,
	patternNumberOrLerfuString,
	patternPaMai,
	patternPaMoi,
	patternSumti,
	patternSumti6,
	patternVerb,
	seq,
	type Pattern,
} from "./pattern";
import type { Selmaho, Token } from "./tokenize";
import { Preparser, type PreparsedType } from "./preparse";

// Helper function to create test tokens
function createToken(selmaho: Selmaho, index: number = 0): Token {
	return {
		index,
		line: 1,
		column: [1, 1],
		erased: [],
		sourceText: selmaho.toLowerCase(),
		lexeme: selmaho.toLowerCase(),
		selmaho,
		indicators: [],
	};
}

function testPattern(tokens: Token<Selmaho>[], pattern: Pattern) {
	const preparser = new Preparser(tokens);
	return matchesPattern(preparser.preparse() as any, 0, pattern);
}

describe("Pattern constructors", () => {
	it("should create among patterns", () => {
		const pattern = among("KE", "SE", "TEI");
		expect(pattern).toEqual({
			type: "among",
			selmaho: ["KE", "SE", "TEI"],
		});
	});

	it("should create notAmong patterns", () => {
		const pattern = notAmong("KE", "SE");
		expect(pattern).toEqual({
			type: "notAmong",
			selmaho: ["KE", "SE"],
		});
	});

	it("should create many patterns with min 0", () => {
		const pattern = many("KE");
		expect(pattern).toEqual({
			type: "many",
			pattern: "KE",
			min: 0,
		});
	});

	it("should create many1 patterns with min 1", () => {
		const pattern = many1("KE");
		expect(pattern).toEqual({
			type: "many",
			pattern: "KE",
			min: 1,
		});
	});

	it("should create sequence patterns", () => {
		const pattern = seq("KE", "MOI");
		expect(pattern).toEqual({
			type: "sequence",
			patterns: ["KE", "MOI"],
		});
	});

	it("should create either patterns", () => {
		const pattern = either("KE", "SE");
		expect(pattern).toEqual({
			type: "either",
			patterns: ["KE", "SE"],
		});
	});

	it("should create optional patterns", () => {
		const pattern = opt("KE");
		expect(pattern).toEqual({
			type: "optional",
			pattern: "KE",
		});
	});

	it("should create end-of-stream patterns", () => {
		const pattern = endOfStream();
		expect(pattern).toEqual({
			type: "end-of-stream",
		});
	});
});

describe("matchesPattern - basic patterns", () => {
	it("should match exact selmaho", () => {
		const tokens = [createToken("KE")];
		const result = testPattern(tokens, "KE");
		expect(result).toEqual({ end: 1 });
	});

	it("should not match different selmaho", () => {
		const tokens = [createToken("SE")];
		const result = testPattern(tokens, "KE");
		expect(result).toBeUndefined();
	});

	it("should return undefined for index out of bounds", () => {
		const tokens = [createToken("SE")];
		const result = matchesPattern(tokens, 1, "SE");
		expect(result).toBeUndefined();
	});
});

describe("matchesPattern - among patterns", () => {
	it("should match when token is in selmaho list", () => {
		const tokens = [createToken("SE")];
		const pattern = among("SE", "SE", "TEI");
		const result = testPattern(tokens, pattern);
		expect(result).toEqual({ end: 1 });
	});

	it("should not match when token is not in selmaho list", () => {
		const tokens = [createToken("MOI")];
		const pattern = among("SE", "SE", "TEI");
		const result = testPattern(tokens, pattern);
		expect(result).toBeUndefined();
	});
});

describe("matchesPattern - notAmong patterns", () => {
	it("should match when token is not in selmaho list", () => {
		const tokens = [createToken("MOI")];
		const pattern = notAmong("SE", "SE", "TEI");
		const result = testPattern(tokens, pattern);
		expect(result).toEqual({ end: 1 });
	});

	it("should not match when token is in selmaho list", () => {
		const tokens = [createToken("SE")];
		const pattern = notAmong("SE", "SE", "TEI");
		const result = testPattern(tokens, pattern);
		expect(result).toBeUndefined();
	});
});

describe("matchesPattern - many patterns", () => {
	it("should match zero occurrences when min is 0", () => {
		const tokens = [createToken("MOI")];
		const pattern = many("KE");
		const result = testPattern(tokens, pattern);
		expect(result).toEqual({ end: 0 });
	});

	it("should match one occurrence when min is 0", () => {
		const tokens = [createToken("KE"), createToken("MOI")];
		const pattern = many("KE");
		const result = testPattern(tokens, pattern);
		expect(result).toEqual({ end: 1 });
	});

	it("should match multiple occurrences when min is 0", () => {
		const tokens = [createToken("KE"), createToken("KE"), createToken("MOI")];
		const pattern = many("KE");
		const result = testPattern(tokens, pattern);
		expect(result).toEqual({ end: 2 });
	});

	it("should match minimum required occurrences when min > 0", () => {
		const tokens = [createToken("KE"), createToken("KE"), createToken("MOI")];
		const pattern = many1("KE");
		const result = testPattern(tokens, pattern);
		expect(result).toEqual({ end: 2 });
	});

	it("should not match when minimum occurrences not met", () => {
		const tokens = [createToken("MOI")];
		const pattern = many1("KE");
		const result = testPattern(tokens, pattern);
		expect(result).toBeUndefined();
	});
});

describe("matchesPattern - sequence patterns", () => {
	it("should match all patterns in sequence", () => {
		const tokens = [createToken("KE"), createToken("MOI")];
		const pattern = seq("KE", "MOI");
		const result = testPattern(tokens, pattern);
		expect(result).toEqual({ end: 2 });
	});

	it("should not match when any pattern fails", () => {
		const tokens = [createToken("KE"), createToken("SE")];
		const pattern = seq("KE", "MOI");
		const result = testPattern(tokens, pattern);
		expect(result).toBeUndefined();
	});

	it("should not match when sequence is incomplete", () => {
		const tokens = [createToken("KE")];
		const pattern = seq("KE", "MOI");
		const result = testPattern(tokens, pattern);
		expect(result).toBeUndefined();
	});
});

describe("matchesPattern - either patterns", () => {
	it("should match first matching pattern", () => {
		const tokens = [createToken("KE")];
		const pattern = either("KE", "SE");
		const result = testPattern(tokens, pattern);
		expect(result).toEqual({ end: 1 });
	});

	it("should match second pattern when first doesn't match", () => {
		const tokens = [createToken("SE")];
		const pattern = either("KE", "SE");
		const result = testPattern(tokens, pattern);
		expect(result).toEqual({ end: 1 });
	});

	it("should not match when no patterns match", () => {
		const tokens = [createToken("MOI")];
		const pattern = either("KE", "SE");
		const result = testPattern(tokens, pattern);
		expect(result).toBeUndefined();
	});
});

describe("matchesPattern - optional patterns", () => {
	it("should match when pattern matches", () => {
		const tokens = [createToken("KE")];
		const pattern = opt("KE");
		const result = testPattern(tokens, pattern);
		expect(result).toEqual({ end: 1 });
	});

	it("should match with end at current index when pattern doesn't match", () => {
		const tokens = [createToken("MOI")];
		const pattern = opt("KE");
		const result = testPattern(tokens, pattern);
		expect(result).toEqual({ end: 0 });
	});
});

describe("matchesPattern - end-of-stream patterns", () => {
	it("should match when at end of stream", () => {
		const tokens: Token[] = [];
		const pattern = endOfStream();
		const result = testPattern(tokens, pattern);
		expect(result).toEqual({ end: 0 });
	});

	it("should not match when not at end of stream", () => {
		const tokens = [createToken("KE")];
		const pattern = endOfStream();
		const result = testPattern(tokens, pattern);
		expect(result).toBeUndefined();
	});
});

describe("matchesPattern - complex nested patterns", () => {
	it("should handle optional within sequence", () => {
		const tokens = [createToken("KE"), createToken("MOI")];
		const pattern = seq(opt("SE"), "KE", "MOI");
		const result = testPattern(tokens, pattern);
		expect(result).toEqual({ end: 2 });
	});

	it("should handle either within sequence", () => {
		const tokens = [createToken("KE"), createToken("MOI")];
		const pattern = seq("KE", either("MOI", "SE"));
		const result = testPattern(tokens, pattern);
		expect(result).toEqual({ end: 2 });
	});
});

describe("Predefined patterns", () => {
	it("should match patternNumber", () => {
		const tokens = [createToken("PA"), createToken("PA"), createToken("MOI")];
		const result = testPattern(tokens, patternNumber);
		expect(result).toEqual({ end: 1 });
	});

	it("should match patternNumberOrLerfuString", () => {
		const tokens = [createToken("BY"), createToken("PA"), createToken("MOI")];
		const result = testPattern(tokens, patternNumberOrLerfuString);
		expect(result).toEqual({ end: 1 });
	});

	it("should match patternPaMoi", () => {
		const tokens = [createToken("PA"), createToken("MOI")];
		const result = testPattern(tokens, patternPaMoi);
		expect(result).toEqual({ end: 2 });
	});

	it("should match patternPaMai", () => {
		const tokens = [createToken("PA"), createToken("MAI")];
		const result = testPattern(tokens, patternPaMai);
		expect(result).toEqual({ end: 2 });
	});

	it("should match patternVerb", () => {
		const tokens = [createToken("SE"), createToken("BRIVLA")];
		const result = testPattern(tokens, patternVerb);
		expect(result).toEqual({ end: 2 });
	});

	it("should match patternSumti6", () => {
		const tokens = [createToken("LAhE")];
		const result = testPattern(tokens, patternSumti6);
		expect(result).toEqual({ end: 1 });
	});

	it("should match patternSumti", () => {
		const tokens = [createToken("PA"), createToken("BRIVLA")];
		const result = testPattern(tokens, patternSumti);
		expect(result).toEqual({ end: 2 });
	});
});

describe("Edge cases and error conditions", () => {
	it("should handle empty token array", () => {
		const tokens: Token[] = [];
		const result = testPattern(tokens, "KE");
		expect(result).toBeUndefined();
	});

	it("should handle complex nested patterns with failures", () => {
		const tokens = [createToken("KE"), createToken("SE")];
		const pattern = seq("KE", many("KE"), "MOI");
		const result = testPattern(tokens, pattern);
		expect(result).toBeUndefined();
	});

	it("should handle many pattern with zero minimum and no matches", () => {
		const tokens = [createToken("MOI")];
		const pattern = many("KE");
		const result = testPattern(tokens, pattern);
		expect(result).toEqual({ end: 0 });
	});
});
