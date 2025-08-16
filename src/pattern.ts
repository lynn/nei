import type { Selmaho, Token } from "./tokenize";

export type Pattern =
	| { type: "among"; selmaho: Selmaho[] }
	| { type: "notAmong"; selmaho: Selmaho[] }
	| { type: "many"; pattern: Pattern; min: number }
	| { type: "sequence"; patterns: Pattern[] }
	| { type: "either"; patterns: Pattern[] }
	| { type: "optional"; pattern: Pattern }
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

export function endOfStream(): Pattern {
	return { type: "end-of-stream" };
}

export const patternPa = seq("PA", many(among("PA", "BY")), "PA");
export const patternPaMoi = seq(patternPa, "MOI");
export const patternPaMai = seq(patternPa, "MAI");

export const patternVerb = seq(
	many(among("NAhE", "KE")),
	among("BRIVLA", "GOhA", "ME", "SE", "JAI", "NU"),
);

export const patternTense = seq(
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
		seq(patternPa, "ROI"),
	),
	opt("NAI"),
);

export const patternTenses = many1(patternTense);

export function matchesPattern(
	tokens: Token[],
	index: number,
	pattern: Pattern,
): { end: number } | undefined {
	if (index >= tokens.length) return undefined;
	const current = tokens[index];

	if (typeof pattern === "string") {
		return pattern === current.selmaho ? { end: index + 1 } : undefined;
	}

	switch (pattern.type) {
		case "among":
			return pattern.selmaho.includes(current.selmaho)
				? { end: index + 1 }
				: undefined;
		case "notAmong":
			return !pattern.selmaho.includes(current.selmaho)
				? { end: index + 1 }
				: undefined;
		case "many": {
			let i = index;
			for (let count = 0; count < pattern.min; count++) {
				const first = matchesPattern(tokens, i, pattern.pattern);
				if (!first) return undefined;
				i = first.end;
			}
			while (true) {
				const next = matchesPattern(tokens, i, pattern.pattern);
				if (!next) break;
				i = next.end;
			}
			return { end: i };
		}
		case "sequence": {
			let i = index;
			for (const subpattern of pattern.patterns) {
				const next = matchesPattern(tokens, i, subpattern);
				if (!next) return undefined;
				i = next.end;
			}
			return { end: i };
		}
		case "optional":
			return matchesPattern(tokens, index, pattern.pattern) || { end: index };
		case "either": {
			for (const subpattern of pattern.patterns) {
				const next = matchesPattern(tokens, index, subpattern);
				if (next) return next;
			}
			return undefined;
		}
		case "end-of-stream":
			return index === tokens.length ? { end: index } : undefined;
		default:
			pattern satisfies never;
	}
}
