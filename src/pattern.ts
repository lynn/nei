import type { Selmaho, Token } from "./tokenize";

export type Pattern =
	| { type: "among"; selmaho: Selmaho[] }
	| { type: "notAmong"; selmaho: Selmaho[] }
	| { type: "many"; pattern: Pattern; min: number }
	| { type: "sequence"; patterns: Pattern[] }
	| { type: "optional"; pattern: Pattern }
	| Selmaho;

export function among(...selmaho: Selmaho[]) {
	return { type: "among", selmaho };
}

export function notAmong(...selmaho: Selmaho[]) {
	return { type: "notAmong", selmaho };
}

export function many(pattern: Pattern) {
	return { type: "many", pattern, min: 0 };
}

export function many1(pattern: Pattern) {
	return { type: "many", pattern, min: 1 };
}

export function seq(...patterns: Pattern[]) {
	return { type: "sequence", patterns };
}

export function opt(pattern: Pattern) {
	return { type: "optional", pattern };
}

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
				const next = matchesPattern(tokens, i, pattern);
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
		default:
			pattern satisfies never;
	}
}
