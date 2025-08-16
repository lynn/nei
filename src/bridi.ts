import type {
	CmavoWithFrees,
	Floating,
	Fragment,
	Positional,
	Role,
	Span,
	TailTerms,
	Term,
	Terms,
} from "./grammar";
import { spanOf } from "./span";
import type { Token } from "./tokenize";

function faToXIndex(fa: CmavoWithFrees, tokens: Token[]): number | "fai" | "?" {
	const lexeme = tokens[fa.cmavo].lexeme;
	if (lexeme === "fa") return 1;
	if (lexeme === "fe") return 2;
	if (lexeme === "fi") return 3;
	if (lexeme === "fo") return 4;
	if (lexeme === "fu") return 5;
	if (lexeme === "fai") return "fai";
	if (lexeme === "fi'a") return "?";
	return 1;
}

class TerbriState {
	public x: number = 1;
	// Bitset of filled positions
	public filled: bigint = 0n;

	constructor(x: number, filled: bigint) {
		this.x = x;
		this.filled = filled;
	}

	public clone(): TerbriState {
		return new TerbriState(this.x, this.filled);
	}

	public advance() {
		while (this.filled & (1n << BigInt(this.x))) this.x++;
	}

	public addTerm(
		term: Term<Floating> & { type: "sumti" | "tagged" },
		tokens: Token[],
	): number | "fai" | "?" | "modal" {
		if (term.type === "sumti") {
			const xIndex = this.x;
			this.filled |= 1n << BigInt(this.x);
			this.advance();
			return xIndex;
		} else {
			if (term.tagOrFa.type !== "tag") {
				const fa = term.tagOrFa;
				const num = faToXIndex(fa, tokens);
				if (typeof num === "number") {
					this.filled |= 1n << BigInt(num);
					this.advance();
					return num;
				} else {
					return num;
				}
			} else {
				return "modal";
			}
		}
	}
}

export class TailState {
	public readonly tertau: Span;
	public readonly state: TerbriState;

	constructor(tertau: Span, state: TerbriState) {
		this.tertau = tertau;
		this.state = state;
	}

	public placeTerm(term: Term<Floating>, tokens: Token[]): Role {
		if (term.type === "naku") {
			throw new Error("naku should not be placed in a positional role");
		} else {
			const xIndex = this.state.addTerm(term, tokens);
			return { xIndex, verb: this.tertau };
		}
	}
}

interface InHead {
	position: number | "fai" | "?" | "modal" | undefined;
}

/**
 * When we've parsed something like
 *
 *     mi fi ta bai do
 *
 * this class stores some state like
 *
 *     head: [
 *         mi (x=1),
 *         fi ta (x=3),
 *         bai do (x="bai"),
 *     ]
 */
export class HeadBridi {
	private head: Term<InHead>[] = [];
	private state: TerbriState = new TerbriState(1, 0n);

	public length(): number {
		return this.head.length;
	}

	public span(): Span {
		return spanOf(this.head);
	}

	public floating(): Term<Floating>[] {
		return this.head.map((term) => ({ ...term, role: "floating" }));
	}

	public asFragment(): Fragment {
		return {
			type: "fragment",
			...this.span(),
			value: { type: "terms", ...this.span(), terms: this.floating() },
		};
	}

	public place(term: Term<Floating>, tokens: Token[]) {
		if (term.type === "naku") {
			this.head.push(term);
		} else {
			const position = this.state.addTerm(term, tokens);
			this.head.push({ ...term, role: { position } });
		}
	}

	public finish(): TailBridi {
		if (this.state.x === 1) {
			// After verb, skip to the x2:
			this.state.x = 2;
		}
		return new TailBridi(this.head, this.state);
	}
}

/**
 * When we've parsed something like
 *
 *     mi ti xamgu broda ta gi'e dunda
 *
 * this class stores some state like
 *
 *     head: [
 *         mi (x=1),
 *         ti (x=3),
 *     ]
 *     groups: [
 *         [
 *            {tertau: broda, state: { x: 4 }}
 *         ],
 *         [
 *            {tertau: dunda, state: { x: 3 }}
 *         ],
 *     ]
 *
 * Placing a term places it in all tail-states of the last group.
 * Something like "vau" can merge the last two groups into one.
 */
export class TailBridi {
	private head: Term<InHead>[];
	private stateAfterHead: TerbriState;
	private groups: TailState[][] = [[]];

	constructor(head: Term<InHead>[], stateAfterHead: TerbriState) {
		this.head = head;
		this.stateAfterHead = stateAfterHead;
	}

	public openGroup(tertau: Span) {
		this.groups.push([new TailState(tertau, this.stateAfterHead.clone())]);
	}

	public closeGroup() {
		const group = this.groups.pop();
		if (!group) throw new Error("No group to close");
		const top = this.groups.at(-1);
		if (!top) throw new Error("No group to merge with");
		top.push(...group);
	}

	public place(term: Term<Floating>, tokens: Token[]): Term<Positional> {
		const top = this.groups.at(-1);
		if (!top) throw new Error("No group to place in");

		if (term.type === "naku") {
			return term;
		} else {
			return {
				...term,
				role: {
					roles: top.map((tail) => tail.placeTerm(term, tokens)),
				},
			};
		}
	}

	public placeTailTerms(
		tailTerms: TailTerms<Floating>,
		tokens: Token[],
	): TailTerms<Positional> {
		return {
			...tailTerms,
			terms: tailTerms.terms
				? this.placeTerms(tailTerms.terms, tokens)
				: undefined,
		};
	}

	public placeTerms(
		terms: Terms<"floating">,
		tokens: Token[],
	): Terms<Positional> | undefined {
		return {
			...terms,
			terms: terms.terms.map((term) => this.place(term, tokens)),
		};
	}

	private termRole(
		term: Term<InHead> & { type: "sumti" | "tagged" },
	): Positional {
		if (this.groups.length !== 1) {
			throw new Error("Can only place head terms in a single group");
		}

		return {
			roles: this.groups[0].map((tail) => {
				if (!term.role.position) {
					throw new Error("No position for term");
				}
				return {
					xIndex: term.role.position,
					verb: tail.tertau,
				};
			}),
		};
	}

	private placeHeadTerm(term: Term<InHead>): Term<Positional> {
		if (term.type === "naku") {
			return term;
		} else {
			return { ...term, role: this.termRole(term) };
		}
	}

	public placeHeadTerms(): Terms<Positional> | undefined {
		if (this.head.length === 0) {
			return undefined;
		}

		return {
			type: "terms",
			...spanOf(this.head),
			terms: this.head.map((term) => this.placeHeadTerm(term)),
		};
	}
}
