import { cmavo } from "./cmavo";

export type Selmaho = "BRIVLA" | "CMEVLA" | (typeof cmavo)[keyof typeof cmavo];

export interface Token {
	index: number;
	/** 1-indexed: line the token was on in the source text. */
	line: number;
	/** 1-indexed. */
	column: [number, number];
	/** Source text, like `.A'E` or `lojbo,` */
	sourceText: string;
	/** Clean form, like `a'e` or `lojbo` */
	lexeme: string;
	/** Token type */
	selmaho: Selmaho;
}

export function wordToLexeme(word: string): string {
	return word.toLowerCase().replaceAll(/[^a-z']/g, "");
}

export function getSelmaho(lexeme: string): Selmaho {
	return (
		(cmavo as Record<string, Selmaho>)[lexeme] ??
		(/[aeiou]$/.test(lexeme) ? "BRIVLA" : "CMEVLA")
	);
}

export function tokenize(text: string): Token[] {
	let lineIndex = 1;
	const tokens: Token[] = [];
	for (const line of text.split("\n")) {
		for (const word of line.matchAll(/\S+/g)) {
			const wordStart = word.index + 1;
			const wordEnd = word.index + word[0].length;
			if (/^([bcdfgjklmnprstvxz'][aeiouy+])+$/.test(word[0])) {
				// This is a cmavo compound. Split it into cmavo:
				for (const cmavo of word[0].matchAll(
					/[bcdfgjklmnprstvxz][aeiouy+]('[aeiouy]+)*/g,
				)) {
					const cmavoStart = wordStart + cmavo.index;
					const cmavoEnd = wordStart + cmavo.index + cmavo[0].length - 1;
					const sourceText = cmavo[0];
					const lexeme = wordToLexeme(sourceText);
					const selmaho = getSelmaho(lexeme);
					tokens.push({
						index: tokens.length,
						line: lineIndex,
						column: [cmavoStart, cmavoEnd],
						sourceText,
						lexeme,
						selmaho,
					});
				}
			} else {
				// It's a brivla, or an attempt at one.
				const lexeme = wordToLexeme(word[0]);
				tokens.push({
					index: tokens.length,
					line: lineIndex,
					column: [wordStart, wordEnd],
					sourceText: word[0],
					lexeme: lexeme,
					selmaho: getSelmaho(lexeme),
				});
			}
		}
		lineIndex++;
	}
	return tokens;
}
