import type { PreparsedType } from "./preparse";
import type { Selmaho, Token } from "./tokenize";

export type Pattern =
	| { type: "preparsed"; value: PreparsedType }
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

export function preparsed(type: PreparsedType): Pattern {
	return { type: "preparsed", value: type };
}

export const patternNumber = preparsed("number");
export const patternLerfuString = preparsed("lerfu-string");
export const patternStm = preparsed("stm");
export const patternJekJoik = either(preparsed("jek"), preparsed("joik"));
export const patternStag = seq(
	preparsed("stm"),
	many(seq(patternJekJoik, preparsed("stm"))),
);
export const patternTmStart = either("FIhO", patternStm);

export const patternNumberOrLerfuString = either(
	patternNumber,
	patternLerfuString,
);
export const patternPaMai = seq(patternNumberOrLerfuString, "MAI");
export const patternPaMoi = seq(patternNumberOrLerfuString, "MOI");

export const patternVerb = seq(
	many(among("NAhE", "KE", "SE")),
	either(among("BRIVLA", "GOhA", "ME", "JAI", "NU"), patternPaMoi),
);

export const patternSumti6 = either(
	seq("NAhE", "BO"),
	among("LAhE", "KOhA", "BY", "LA", "LE", "LI", "QUOTE", "LU"),
	patternLerfuString,
);

export const patternSumti = either(
	seq(opt(patternNumber), patternSumti6),
	seq(patternNumber, patternVerb),
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
		case "preparsed":
			return current?.preparsed?.type === pattern.value
				? { end: index + 1 }
				: undefined;
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
