import { ParseError } from "./error";
import type {
	CmavoWithFrees,
	Free,
	LerfuString,
	LerfuWord,
	Namcu,
	Pa,
	Span,
	TokenIndex,
} from "./grammar";
import type { Snapshot } from "./parse";
import type { Selmaho, Token } from "./tokenize";

export class BaseParser {
	public readonly tokens: Token[];
	public index: TokenIndex;
	public state: string[];
	public snapshots: Snapshot[];
	public depth = 0;

	constructor(tokens: Token[]) {
		this.tokens = tokens;
		this.index = 0;
		this.state = [];
		this.snapshots = [];
	}

	protected takeSnapshot(completed?: Span) {
		this.snapshots.push({
			index: this.index,
			state: [...this.state],
			completed,
		});
	}

	protected begin(type: string) {
		this.state.push(`Parsing ${type}`);
		this.takeSnapshot();
	}

	protected log(text: string, completed?: Span) {
		if (this.state.length) this.state.pop();
		this.state.push(text);
		this.takeSnapshot(completed);
	}

	protected parsed<T extends Span>(type: string, result: T): T {
		this.state.pop();
		this.state.push(
			`Finished ${type} (${this.tokens
				.slice(result.start, result.end + 1)
				.map((x) => x.lexeme)
				.join(" ")})`,
		);
		this.takeSnapshot(result);
		this.state.pop();

		return result;
	}

	protected nextToken(): Token | undefined {
		if (this.index < this.tokens.length) {
			return this.tokens[this.index++];
		}
		return undefined;
	}

	protected peekToken(): Token | undefined {
		if (this.index < this.tokens.length) {
			return this.tokens[this.index];
		}
		return undefined;
	}

	protected isAhead(selmahos: Selmaho[]): boolean {
		return selmahos.every((s, i) => this.tokens[this.index + i]?.selmaho === s);
	}

	protected tryParseCmavo(selmaho: Selmaho): TokenIndex | undefined {
		if (this.peekToken()?.selmaho === selmaho) {
			return this.index++;
		}
	}

	protected tryParseCmavoWithFrees(
		selmaho: Selmaho,
	): CmavoWithFrees | undefined {
		const token = this.peekToken();
		if (token && token.selmaho === selmaho) {
			this.index++;
			const frees = this.parseFrees();
			return {
				start: token.index,
				end: frees.at(-1)?.end ?? token.index,
				type: "cmavo-with-frees",
				cmavo: token.index,
				frees,
			};
		}
		return undefined;
	}

	protected parseFrees(): Free[] {
		const frees: Free[] = [];
		while (true) {
			const token = this.peekToken();
			if (token?.selmaho === "UI" || token?.selmaho === "CAI") {
				frees.push({ type: "free", start: token.index, end: token.index });
				this.index++;
			} else {
				break;
			}
		}
		return frees;
	}

	protected tryParseNamcu(): Namcu | undefined {
		if (this.peekToken()?.selmaho === "PA") {
			return this.parseNamcu();
		} else {
			return undefined;
		}
	}

	protected parseNamcu(): Namcu {
		const first = this.parsePa();
		let end = first.end;
		const rest: (Pa | LerfuWord)[] = [];
		while (true) {
			const next = this.tryParsePa() ?? this.tryParseLerfuWord();
			if (!next) break;
			end = next.end;
			rest.push(next);
		}
		return { type: "number", start: first.start, end, first, rest };
	}

	protected parsePa(): Pa {
		const token = this.nextToken();
		if (!token || token.selmaho !== "PA") {
			throw new ParseError("Expected digit");
		}
		return { type: "pa", start: token.index, end: token.index };
	}

	protected tryParsePa(): Pa | undefined {
		const token = this.tryParseCmavo("PA");
		if (token) {
			return { type: "pa", start: token, end: token };
		}
		return undefined;
	}

	protected tryParseLerfuWord(): LerfuWord | undefined {
		const by = this.tryParseCmavo("BY");
		if (by === undefined) return undefined;
		return { type: "lerfu-word", start: by, end: by, by };
	}

	protected tryParseLerfuString(): LerfuString | undefined {
		const first = this.tryParseLerfuWord();
		if (!first) {
			return undefined;
		}
		const rest: (Pa | LerfuWord)[] = [];
		while (true) {
			const next = this.tryParseLerfuWord() ?? this.tryParsePa();
			if (!next) break;
		}
		return {
			type: "lerfu-string",
			start: first.start,
			end: rest.length ? rest[rest.length - 1].end : first.end,
			first,
			rest,
		};
	}
}
