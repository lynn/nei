import { describe, it, expect } from "vitest";
import {
	among,
	notAmong,
	many,
	many1,
	seq,
	either,
	opt,
	endOfStream,
	patternNumber,
	patternNumberOrLerfuString,
	patternPaMoi,
	patternPaMai,
	patternVerb,
	patternSumti6,
	patternSumti,
	matchesPattern,
} from "./pattern";
import type { Token, Selmaho } from "./tokenize";

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

describe("Pattern constructors", () => {
	console.log("hi");
	it("should create among patterns", () => {
		const pattern = among("PA", "BY", "TEI");
		expect(pattern).toEqual({
			type: "among",
			selmaho: ["PA", "BY", "TEI"],
		});
	});

	it("should create notAmong patterns", () => {
		const pattern = notAmong("PA", "BY");
		expect(pattern).toEqual({
			type: "notAmong",
			selmaho: ["PA", "BY"],
		});
	});

	it("should create many patterns with min 0", () => {
		const pattern = many("PA");
		expect(pattern).toEqual({
			type: "many",
			pattern: "PA",
			min: 0,
		});
	});

	it("should create many1 patterns with min 1", () => {
		const pattern = many1("PA");
		expect(pattern).toEqual({
			type: "many",
			pattern: "PA",
			min: 1,
		});
	});

	it("should create sequence patterns", () => {
		const pattern = seq("PA", "MOI");
		expect(pattern).toEqual({
			type: "sequence",
			patterns: ["PA", "MOI"],
		});
	});

	it("should create either patterns", () => {
		const pattern = either("PA", "BY");
		expect(pattern).toEqual({
			type: "either",
			patterns: ["PA", "BY"],
		});
	});

	it("should create optional patterns", () => {
		const pattern = opt("PA");
		expect(pattern).toEqual({
			type: "optional",
			pattern: "PA",
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
		const tokens = [createToken("PA")];
		const result = matchesPattern(tokens, 0, "PA");
		expect(result).toEqual({ end: 1 });
	});

	it("should not match different selmaho", () => {
		const tokens = [createToken("BY")];
		const result = matchesPattern(tokens, 0, "PA");
		expect(result).toBeUndefined();
	});

	it("should return undefined for index out of bounds", () => {
		const tokens = [createToken("PA")];
		const result = matchesPattern(tokens, 1, "PA");
		expect(result).toBeUndefined();
	});
});

describe("matchesPattern - among patterns", () => {
	it("should match when token is in selmaho list", () => {
		const tokens = [createToken("PA")];
		const pattern = among("PA", "BY", "TEI");
		const result = matchesPattern(tokens, 0, pattern);
		expect(result).toEqual({ end: 1 });
	});

	it("should not match when token is not in selmaho list", () => {
		const tokens = [createToken("MOI")];
		const pattern = among("PA", "BY", "TEI");
		const result = matchesPattern(tokens, 0, pattern);
		expect(result).toBeUndefined();
	});
});

describe("matchesPattern - notAmong patterns", () => {
	it("should match when token is not in selmaho list", () => {
		const tokens = [createToken("MOI")];
		const pattern = notAmong("PA", "BY", "TEI");
		const result = matchesPattern(tokens, 0, pattern);
		expect(result).toEqual({ end: 1 });
	});

	it("should not match when token is in selmaho list", () => {
		const tokens = [createToken("PA")];
		const pattern = notAmong("PA", "BY", "TEI");
		const result = matchesPattern(tokens, 0, pattern);
		expect(result).toBeUndefined();
	});
});

describe("matchesPattern - many patterns", () => {
	it("should match zero occurrences when min is 0", () => {
		const tokens = [createToken("MOI")];
		const pattern = many("PA");
		const result = matchesPattern(tokens, 0, pattern);
		expect(result).toEqual({ end: 0 });
	});

	it("should match one occurrence when min is 0", () => {
		const tokens = [createToken("PA"), createToken("MOI")];
		const pattern = many("PA");
		const result = matchesPattern(tokens, 0, pattern);
		expect(result).toEqual({ end: 1 });
	});

	it("should match multiple occurrences when min is 0", () => {
		const tokens = [createToken("PA"), createToken("PA"), createToken("MOI")];
		const pattern = many("PA");
		const result = matchesPattern(tokens, 0, pattern);
		expect(result).toEqual({ end: 2 });
	});

	it("should match minimum required occurrences when min > 0", () => {
		const tokens = [createToken("PA"), createToken("PA"), createToken("MOI")];
		const pattern = many1("PA");
		const result = matchesPattern(tokens, 0, pattern);
		expect(result).toEqual({ end: 2 });
	});

	it("should not match when minimum occurrences not met", () => {
		const tokens = [createToken("MOI")];
		const pattern = many1("PA");
		const result = matchesPattern(tokens, 0, pattern);
		expect(result).toBeUndefined();
	});
});

describe("matchesPattern - sequence patterns", () => {
	it("should match all patterns in sequence", () => {
		const tokens = [createToken("PA"), createToken("MOI")];
		const pattern = seq("PA", "MOI");
		const result = matchesPattern(tokens, 0, pattern);
		expect(result).toEqual({ end: 2 });
	});

	it("should not match when any pattern fails", () => {
		const tokens = [createToken("PA"), createToken("BY")];
		const pattern = seq("PA", "MOI");
		const result = matchesPattern(tokens, 0, pattern);
		expect(result).toBeUndefined();
	});

	it("should not match when sequence is incomplete", () => {
		const tokens = [createToken("PA")];
		const pattern = seq("PA", "MOI");
		const result = matchesPattern(tokens, 0, pattern);
		expect(result).toBeUndefined();
	});
});

describe("matchesPattern - either patterns", () => {
	it("should match first matching pattern", () => {
		const tokens = [createToken("PA")];
		const pattern = either("PA", "BY");
		const result = matchesPattern(tokens, 0, pattern);
		expect(result).toEqual({ end: 1 });
	});

	it("should match second pattern when first doesn't match", () => {
		const tokens = [createToken("BY")];
		const pattern = either("PA", "BY");
		const result = matchesPattern(tokens, 0, pattern);
		expect(result).toEqual({ end: 1 });
	});

	it("should not match when no patterns match", () => {
		const tokens = [createToken("MOI")];
		const pattern = either("PA", "BY");
		const result = matchesPattern(tokens, 0, pattern);
		expect(result).toBeUndefined();
	});
});

describe("matchesPattern - optional patterns", () => {
	it("should match when pattern matches", () => {
		const tokens = [createToken("PA")];
		const pattern = opt("PA");
		const result = matchesPattern(tokens, 0, pattern);
		expect(result).toEqual({ end: 1 });
	});

	it("should match with end at current index when pattern doesn't match", () => {
		const tokens = [createToken("MOI")];
		const pattern = opt("PA");
		const result = matchesPattern(tokens, 0, pattern);
		expect(result).toEqual({ end: 0 });
	});
});

describe("matchesPattern - end-of-stream patterns", () => {
	it("should match when at end of stream", () => {
		const tokens: Token[] = [];
		const pattern = endOfStream();
		const result = matchesPattern(tokens, 0, pattern);
		expect(result).toEqual({ end: 0 });
	});

	it("should not match when not at end of stream", () => {
		const tokens = [createToken("PA")];
		const pattern = endOfStream();
		const result = matchesPattern(tokens, 0, pattern);
		expect(result).toBeUndefined();
	});
});

describe("matchesPattern - complex nested patterns", () => {
	it("should handle optional within sequence", () => {
		const tokens = [createToken("PA"), createToken("MOI")];
		const pattern = seq(opt("BY"), "PA", "MOI");
		const result = matchesPattern(tokens, 0, pattern);
		expect(result).toEqual({ end: 2 });
	});

	it("should handle either within sequence", () => {
		const tokens = [createToken("PA"), createToken("MOI")];
		const pattern = seq("PA", either("MOI", "BY"));
		const result = matchesPattern(tokens, 0, pattern);
		expect(result).toEqual({ end: 2 });
	});
});

describe("Predefined patterns", () => {
	it("should match patternNumber", () => {
		const tokens = [createToken("PA"), createToken("BY"), createToken("MOI")];
		const result = matchesPattern(tokens, 0, patternNumber);
		expect(result).toEqual({ end: 2 });
	});

	it("should match patternNumberOrLerfuString", () => {
		const tokens = [createToken("PA"), createToken("BY"), createToken("MOI")];
		const result = matchesPattern(tokens, 0, patternNumberOrLerfuString);
		expect(result).toEqual({ end: 2 });
	});

	it("should match patternPaMoi", () => {
		const tokens = [createToken("PA"), createToken("MOI")];
		const result = matchesPattern(tokens, 0, patternPaMoi);
		expect(result).toEqual({ end: 2 });
	});

	it("should match patternPaMai", () => {
		const tokens = [createToken("PA"), createToken("MAI")];
		const result = matchesPattern(tokens, 0, patternPaMai);
		expect(result).toEqual({ end: 2 });
	});

	it("should match patternVerb", () => {
		const tokens = [createToken("KE"), createToken("BRIVLA")];
		const result = matchesPattern(tokens, 0, patternVerb);
		expect(result).toEqual({ end: 2 });
	});

	it("should match patternSumti6", () => {
		const tokens = [createToken("LAhE")];
		const result = matchesPattern(tokens, 0, patternSumti6);
		expect(result).toEqual({ end: 1 });
	});

	it("should match patternSumti", () => {
		const tokens = [createToken("PA"), createToken("BRIVLA")];
		const result = matchesPattern(tokens, 0, patternSumti);
		expect(result).toEqual({ end: 2 });
	});
});

describe("Edge cases and error conditions", () => {
	it("should handle empty token array", () => {
		const tokens: Token[] = [];
		const result = matchesPattern(tokens, 0, "PA");
		expect(result).toBeUndefined();
	});

	it("should handle complex nested patterns with failures", () => {
		const tokens = [createToken("PA"), createToken("BY")];
		const pattern = seq("PA", many("PA"), "MOI");
		const result = matchesPattern(tokens, 0, pattern);
		expect(result).toBeUndefined();
	});

	it("should handle many pattern with zero minimum and no matches", () => {
		const tokens = [createToken("MOI")];
		const pattern = many("PA");
		const result = matchesPattern(tokens, 0, pattern);
		expect(result).toEqual({ end: 0 });
	});
});
