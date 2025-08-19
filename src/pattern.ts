import type { Selmaho, Token } from "./tokenize";

export type Pattern =
	| { type: "among"; selmaho: Selmaho[] }
	| { type: "notAmong"; selmaho: Selmaho[] }
	| { type: "many"; pattern: Pattern; min: number }
	| { type: "sequence"; patterns: Pattern[] }
	| { type: "either"; patterns: Pattern[] }
	| { type: "optional"; pattern: Pattern }
	| { type: "not"; pattern: Pattern }
	| { type: "end-of-stream" }
	| Selmaho;

export function among(...selmaho: Selmaho[]): Pattern {
	return { type: "among", selmaho };
}

export function notAmong(...selmaho: Selmaho[]): Pattern {
	return { type: "notAmong", selmaho };
}

export function many(pattern: Pattern): Pattern {
	return { type: "many", pattern, min: 0 };
}

export function many1(pattern: Pattern): Pattern {
	return { type: "many", pattern, min: 1 };
}

export function seq(...patterns: Pattern[]): Pattern {
	return { type: "sequence", patterns };
}

export function either(...patterns: Pattern[]): Pattern {
	return { type: "either", patterns };
}

export function opt(pattern: Pattern): Pattern {
	return { type: "optional", pattern };
}

export function not(pattern: Pattern): Pattern {
	return { type: "not", pattern };
}

export function endOfStream(): Pattern {
	return { type: "end-of-stream" };
}

export const patternNumber = seq(
	"PA",
	many(among("PA", "BY", "TEI", "FOI", "LAU")),
);
export const patternNumberOrLerfuString = many1(
	among("PA", "BY", "TEI", "FOI", "LAU"),
);
export const patternPaMoi = seq(patternNumberOrLerfuString, "MOI");
export const patternPaMai = seq(patternNumberOrLerfuString, "MAI");

export const patternVerb = seq(
	many(among("NAhE", "KE")),
	either(among("BRIVLA", "GOhA", "ME", "SE", "JAI", "NU"), patternPaMoi),
);

export const patternSumti6 = either(
	seq("NAhE", "BO"),
	among("LAhE", "KOhA", "BY", "LA", "LE", "LI", "QUOTE", "LU"),
);

export const patternSumti = either(
	seq(many("PA"), patternSumti6),
	seq(many1("PA"), patternVerb),
);

export const patternTag = seq(
	opt("NAhE"),
	opt("SE"),
	either(
		among(
			"FA", // dubious but CLL says so
			"BAI",
			"CAhA",
			"KI",
			"CUhE",
			"ZI",
			"ZEhA",
			"PU",
			// "NAI",
			"VA",
			"MOhI",
			"FAhA",
			"VEhA",
			"VIhA",
			"FEhE",
			"TAhE",
			"ZAhO",
		),
		seq(patternNumber, "ROI"),
	),
	opt("NAI"),
);

export function matchesPattern(
	tokens: Token[],
	index: number,
	pattern: Pattern,
	depth: number = 0,
): { end: number } | undefined {
	if (depth > 100) throw new Error("depth limit exceeded");
	const current = tokens[index];

	if (typeof pattern === "string") {
		return pattern === current?.selmaho ? { end: index + 1 } : undefined;
	}

	switch (pattern.type) {
		case "among":
			return current !== undefined && pattern.selmaho.includes(current.selmaho)
				? { end: index + 1 }
				: undefined;
		case "notAmong":
			return current !== undefined && pattern.selmaho.includes(current.selmaho)
				? undefined
				: { end: index + 1 };
		case "many": {
			let i = index;
			for (let count = 0; count < pattern.min; count++) {
				const first = matchesPattern(tokens, i, pattern.pattern, depth + 1);
				if (!first) return undefined;
				i = first.end;
			}
			while (true) {
				const next = matchesPattern(tokens, i, pattern.pattern, depth + 1);
				if (!next) break;
				i = next.end;
			}
			return { end: i };
		}
		case "sequence": {
			let i = index;
			for (const subpattern of pattern.patterns) {
				const next = matchesPattern(tokens, i, subpattern, depth + 1);
				if (!next) return undefined;
				i = next.end;
			}
			return { end: i };
		}
		case "optional":
			return (
				matchesPattern(tokens, index, pattern.pattern, depth + 1) || {
					end: index,
				}
			);
		case "either": {
			for (const subpattern of pattern.patterns) {
				const next = matchesPattern(tokens, index, subpattern, depth + 1);
				if (next) return next;
			}
			return undefined;
		}
		case "not":
			return matchesPattern(tokens, index, pattern.pattern, depth + 1)
				? undefined
				: { end: index };
		case "end-of-stream":
			return index === tokens.length ? { end: index } : undefined;
		default:
			pattern satisfies never;
	}
}
