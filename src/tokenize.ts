import { cmavo } from "./cmavo";

export type Selmaho =
	| "BRIVLA"
	| "CMEVLA"
	| (typeof cmavo)[keyof typeof cmavo]
	| "QUOTE";

export function isTenseSelmaho(selmaho: Selmaho): boolean {
	return [
		"FA", // dubious but CLL says so
		"BAI",
		"CAhA",
		"KI",
		"CUhE",
		"ZI",
		"ZEhA",
		"PU",
		"NAI", // ehhh
		"VA",
		"MOhI",
		"FAhA",
		"VEhA",
		"VIhA",
		"FEhE",
		// TODO: handle number+roi here
		"TAhE",
		"ZAhO",
	].includes(selmaho);
}

export interface Token {
	index: number;
	/** 1-indexed: line the token was on in the source text. */
	line: number;
	/** 1-indexed. */
	column: [number, number];
	/** Erased source text before this token. */
	erased: string[];
	/** Source text, like `.A'E` or `lojbo,` */
	sourceText: string;
	/** Clean form, like `a'e` or `lojbo` */
	lexeme: string;
	/** Indicators after this token. */
	indicators: Token[];
	/** Token type */
	selmaho: Selmaho;
}

export class Tokenizer {
	cmevlaBrivlaMerger: boolean;

	constructor({ cmevlaBrivlaMerger }: { cmevlaBrivlaMerger: boolean }) {
		this.cmevlaBrivlaMerger = cmevlaBrivlaMerger;
	}

	private lineIndex = 1;
	private tokens: Token[] = [];
	private erased: string[] = [];
	private lastZo: boolean = false;
	private lastBahe: boolean = false;
	private lohuSource: string[] | undefined = undefined;

	private push(
		column: [number, number],
		sourceText: string,
		lexeme: string,
		selmaho: Selmaho,
	) {
		if (this.lastZo) {
			const zo = this.tokens.pop();
			if (!zo) throw new Error("impossible");
			this.tokens.push({
				...zo,
				column: [zo.column[0], column[1]],
				sourceText: `${zo.sourceText} ${sourceText}`,
				lexeme: "zo",
				selmaho: "QUOTE",
			});
			this.lastZo = false;
		} else if (lexeme === "lo'u") {
			this.lohuSource = [sourceText];
		} else if (this.lohuSource) {
			this.lohuSource.push(sourceText);

			if (lexeme === "le'u") {
				this.tokens.push({
					index: this.tokens.length,
					line: this.lineIndex,
					column,
					erased: [...this.erased],
					sourceText: this.lohuSource.join(" "),
					lexeme: "lo'u",
					indicators: [],
					selmaho: "QUOTE",
				});
				this.lohuSource = undefined;
				this.erased = [];
			}
		} else if (lexeme === "si") {
			this.erased = [
				this.tokens.pop()?.sourceText ?? "?",
				...this.erased,
				sourceText,
			];
		} else if (lexeme === "bu") {
			const last = this.tokens.pop();
			if (!last) throw new Error("impossible");

			this.tokens.push({
				index: this.tokens.length,
				line: this.lineIndex,
				column: [last.column[0], column[1]],
				erased: [...this.erased],
				sourceText: `${last.sourceText} ${sourceText}`,
				lexeme: `${last.lexeme} ${lexeme}`,
				indicators: [],
				selmaho: "BY",
			});
		} else {
			if (this.lastBahe) {
				const last = this.tokens.pop();
				if (!last) throw new Error("impossible");
				lexeme = `${last.lexeme} ${lexeme}`;
				sourceText = `${last.sourceText} ${sourceText}`;
				this.lastBahe = false;
			}
			const newToken: Token = {
				index: this.tokens.length,
				line: this.lineIndex,
				column,
				erased: [...this.erased],
				sourceText,
				lexeme,
				indicators: [],
				selmaho,
			};

			const last = this.tokens.at(-1);

			if (
				last !== undefined &&
				(last.selmaho === "FAhO" ||
					selmaho === "FUhE" ||
					["UI", "CAI", "Y", "DAhO", "FUhO"].includes(selmaho) ||
					(selmaho === "NAI" &&
						["UI", "CAI"].includes(last.indicators.at(-1)?.selmaho ?? "")))
			) {
				last.indicators.push(newToken);
			} else if (last?.indicators?.at(-1)?.selmaho === "FUhE") {
				throw new Error("FUhE must be followed by another indicator");
			} else {
				this.tokens.push(newToken);
			}
			this.lastZo = lexeme === "zo";
			this.lastBahe = selmaho === "BAhE";
			this.erased = [];
		}
	}

	tokenize(text: string): Token[] {
		this.lineIndex = 1;
		this.tokens = [];
		for (const line of text.split("\n")) {
			for (const word of line.matchAll(/\S+/g)) {
				const wordStart = word.index + 1;
				const wordEnd = word.index + word[0].length;
				if (/^([bcdfgjklmnprstvxz.']?[aeiou]+)+$/.test(word[0])) {
					// This is a cmavo compound. Split it into cmavo:
					for (const cmavo of word[0].matchAll(
						/[bcdfgjklmnprstvxz.]?[aeiou]+('[aeiou]+)*/g,
					)) {
						const cmavoStart = wordStart + cmavo.index;
						const cmavoEnd = wordStart + cmavo.index + cmavo[0].length - 1;
						const sourceText = cmavo[0];
						const lexeme = wordToLexeme(sourceText);
						const selmaho = getSelmaho(lexeme);
						this.push([cmavoStart, cmavoEnd], sourceText, lexeme, selmaho);
					}
				} else {
					// It's a brivla, or an attempt at one.
					const lexeme = wordToLexeme(word[0]);
					let selmaho = getSelmaho(lexeme);
					if (this.cmevlaBrivlaMerger && selmaho === "CMEVLA") {
						selmaho = "BRIVLA";
					}
					this.push([wordStart, wordEnd], word[0], lexeme, selmaho);
				}
			}
			this.lineIndex++;
		}
		if (this.lohuSource !== undefined) throw new Error("unclosed lo'u");
		return this.tokens;
	}
}

export function wordToLexeme(word: string): string {
	return word
		.toLowerCase()
		.replaceAll(/[^a-z']/g, "")
		.replaceAll(/y+/g, "y");
}

export function getSelmaho(lexeme: string): Selmaho {
	return (
		(cmavo as Record<string, Selmaho>)[lexeme] ??
		(/[aeiou]$/.test(lexeme.replaceAll(/\./g, "")) ? "BRIVLA" : "CMEVLA")
	);
}
