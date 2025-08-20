import { ParseError } from "./error";
import type {
	LerfuString,
	LerfuWord,
	Namcu,
	Pa,
	Span,
	TokenIndex,
} from "./grammar";
import type { Snapshot } from "./parse";
import { matchesPattern, type Pattern } from "./pattern";
import type { Selmaho, Token } from "./tokenize";

export class BaseParser {
	public readonly tokens: Token[];
	public index: TokenIndex;
	public breadcrumbs: string[];
	public state: string;
	public snapshots: Snapshot[];
	public depth = 0;

	constructor(tokens: Token[]) {
		this.tokens = tokens;
		this.index = 0;
		this.breadcrumbs = [];
		this.state = "";
		this.snapshots = [];
	}

	protected takeSnapshot(completed?: Span) {
		this.snapshots.push({
			index: this.index,
			breadcrumbs: [...this.breadcrumbs],
			state: this.state,
			completed,
		});
	}

	protected begin(type: string) {
		this.breadcrumbs.push(type);
		this.takeSnapshot();
	}

	protected end() {
		this.breadcrumbs.pop();
		this.takeSnapshot();
	}

	protected log(text: string, completed?: Span) {
		this.state = text;
		this.takeSnapshot(completed);
	}

	protected parsed<T extends Span>(type: string, result: T): T {
		this.breadcrumbs.pop();
		this.state = `Finished ${type} (${this.tokens
			.slice(result.start, result.end + 1)
			.map((x) => x.lexeme)
			.join(" ")})`;
		this.takeSnapshot(result);

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

	protected logScan(name: string, match: { end: number } | undefined) {
		const msg = `Scanning for ${name}: ${match ? "found" : "not found"}`;
		const mark = match ? { start: this.index, end: match.end - 1 } : undefined;
		const last = this.snapshots.at(-1);
		if (last?.state?.endsWith("not found")) {
			last.state += `\n${msg}`;
			last.completed = mark;
		} else {
			this.log(msg, mark);
		}
	}

	protected isAhead(pattern: Pattern, name: string): boolean {
		const match = matchesPattern(this.tokens, this.index, pattern);
		this.logScan(name, match);
		return match !== undefined;
	}

	protected tryParseCmavo(selmaho: Selmaho): TokenIndex | undefined {
		if (this.peekToken()?.selmaho === selmaho) {
			return this.index++;
		}
	}

	protected parseCmavos(selmaho: Selmaho): TokenIndex[] {
		const cmavos = [];
		while (true) {
			const next = this.tryParseCmavo(selmaho);
			if (next === undefined) break;
			cmavos.push(next);
		}
		return cmavos;
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
