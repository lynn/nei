import type { Span, TokenIndex } from "./grammar";
import type { Snapshot } from "./parse";
import { matchesPattern, type Pattern } from "./pattern";
import type { Selmaho, Token } from "./tokenize";

export class BaseParser<
	S extends string = Selmaho,
	T extends Token<S> = Token<S>,
> {
	public readonly tokens: T[];
	public index: TokenIndex;
	public breadcrumbs: string[];
	public state: string;
	public snapshots: Snapshot[];
	public depth = 0;

	constructor(tokens: T[]) {
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

	protected nextToken(): T | undefined {
		if (this.index < this.tokens.length) {
			return this.tokens[this.index++];
		}
		return undefined;
	}

	protected peekToken(): T | undefined {
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
		// TODO remove as?
		const match = matchesPattern(this.tokens as Token[], this.index, pattern);
		this.logScan(name, match);
		return match !== undefined;
	}

	protected tryParseCmavo(selmaho: S): TokenIndex | undefined {
		if (this.peekToken()?.selmaho === selmaho) {
			return this.index++;
		}
	}

	protected parseCmavos(selmaho: S): TokenIndex[] {
		const cmavos = [];
		while (true) {
			const next = this.tryParseCmavo(selmaho);
			if (next === undefined) break;
			cmavos.push(next);
		}
		return cmavos;
	}
}
