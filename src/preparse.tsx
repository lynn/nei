import { ParseError } from "./error";
import type {
	Ek,
	Gihek,
	IntervalProperty,
	Jek,
	Joik,
	LerfuString,
	LerfuWord,
	Motion,
	Namcu,
	Pa,
	Space,
	SpaceInterval,
	SpaceIntProp,
	SpaceOffset,
	Spacetime,
	Stm,
	StmBai,
	StmTense,
	Time,
	TimeOffset,
	Timespace,
	Vxha,
	Zehapu,
} from "./grammar";
import { BaseParser } from "./parse-base";
import { among, opt, seq } from "./pattern";
import { spanOf } from "./span";
import type { Selmaho, Token } from "./tokenize";

/**
 * Responsibilities of the pre-parser:
 *
 * - turn PA (PA|BY)* into "Namcu"
 * - turn BY (PA|BY)* into "Lerpoi"
 * - turn [NA] [SE] A [NAI] into "Ek"
 * - turn [NA] [SE] GIhA [NAI] into "Gihek"
 * - turn [NA] [SE] JA [NAI] into "Jek"
 * - turn [SE] JOI [NAI] | interval | GAhO interval GAhO into "Joik"
 * - turn stm into "Stm"
 * - turn any other token into itself
 */

/**
 * Selmaho that we intend to clean up in this pass.
 */
export const SmallSelmaho = {
	// Namcu and Lerpoi:
	PA: "PA",
	BY: "BY",
	BU: "BU",
	LAU: "LAU",
	TEI: "TEI",
	FOI: "FOI",
	// Ek:
	A: "A",
	// Gihek:
	GIhA: "GIhA",
	// Jek:
	JA: "JA",
	// Joik:
	JOI: "JOI",
	BIhI: "BIhI",
	GAhO: "GAhO",
	// Stm:
	BAI: "BAI",
	CAhA: "CAhA",
	KI: "KI",
	CUhE: "CUhE",
	ZI: "ZI",
	ZEhA: "ZEhA",
	PU: "PU",
	VA: "VA",
	MOhI: "MOhI",
	FAhA: "FAhA",
	VEhA: "VEhA",
	VIhA: "VIhA",
	FEhE: "FEhE",
	ROI: "ROI",
	TAhE: "TAhE",
	ZAhO: "ZAhO",
} as const;

export type SmallSelmaho = keyof typeof SmallSelmaho;

function isSmallSelmaho(
	selmaho: Selmaho | BigSelmaho,
): selmaho is SmallSelmaho {
	return selmaho in SmallSelmaho;
}

export type Preparsed = Namcu | LerfuString | Stm | Ek | Gihek | Jek | Joik;
export type PreparsedType = Preparsed["type"];
export type BigSelmaho = Exclude<Selmaho, SmallSelmaho> | PreparsedType;

export class Preparser extends BaseParser<Selmaho> {
	private toToken(token: Preparsed): Token<BigSelmaho> {
		return {
			...token,
			selmaho: token.type as BigSelmaho,
			index: token.start,
			line: 1,
			column: [0, 0],
			erased: [],
			sourceText: "asdf",
			lexeme: "asdf",
			indicators: [],
		};
	}

	preparse(): Token<BigSelmaho>[] {
		const result: Token<BigSelmaho>[] = [];

		while (this.index < this.tokens.length) {
			const token = this.nextToken();
			if (!token) break;

			const namcu = this.tryParseNamcu();
			if (namcu) {
				result.push(this.toToken(namcu));
				continue;
			}

			const lerpoi = this.tryParseLerfuString();
			if (lerpoi) {
				result.push(this.toToken(lerpoi));
				continue;
			}

			const joik = this.tryParseJoik();
			if (joik) {
				result.push(this.toToken(joik));
				continue;
			}

			const jek = this.tryParseJek();
			if (jek) {
				result.push(this.toToken(jek));
				continue;
			}

			const stm = this.tryParseSimpleTenseModal();
			if (stm) {
				result.push(this.toToken(stm));
				continue;
			}

			const ek = this.tryParseEk();
			if (ek) {
				result.push(this.toToken(ek));
				continue;
			}

			const gihek = this.tryParseGihek();
			if (gihek) {
				result.push(this.toToken(gihek));
				continue;
			}

			if (!isSmallSelmaho(token.selmaho)) {
				result.push(token as Token<BigSelmaho>);
			} else {
				throw new ParseError("Bad selmaho", token.index);
			}
		}
		return result;
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

	protected tryParseJoik(): Joik | undefined {
		const backtrack = this.index;
		const gaho1 = this.tryParseCmavo("GAhO");
		const se = this.tryParseCmavo("SE");
		const token = this.nextToken();
		if (!token || (token.selmaho !== "JOI" && token.selmaho !== "BIhI")) {
			this.index = backtrack;
			return undefined;
		}
		const nai = this.tryParseCmavo("NAI");
		const gaho2 = this.tryParseCmavo("GAhO");
		if (
			token.selmaho === "JOI" &&
			(gaho1 !== undefined || gaho2 !== undefined)
		) {
			this.index = backtrack;
			return undefined;
		}
		if ((gaho1 === undefined) !== (gaho2 === undefined)) {
			this.index = backtrack;
			return undefined;
		}
		return {
			type: "joik",
			gaho1,
			se,
			joi: token.index,
			nai,
			gaho2,
			...spanOf(gaho1, se, token, nai, gaho2),
		};
	}

	protected tryParseJek(): Jek | undefined {
		const backtrack = this.index;
		const na = this.tryParseCmavo("NA");
		const se = this.tryParseCmavo("SE");
		const ja = this.tryParseCmavo("JA");
		if (ja === undefined) {
			this.index = backtrack;
			return undefined;
		}
		const nai = this.tryParseCmavo("NAI");

		return {
			type: "jek",
			na,
			se,
			ja,
			nai,
			...spanOf(na, se, ja, nai),
		};
	}

	protected tryParseGihek(): Gihek | undefined {
		const backtrack = this.index;
		const na = this.tryParseCmavo("NA");
		const se = this.tryParseCmavo("SE");
		const giha = this.tryParseCmavo("GIhA");
		if (giha === undefined) {
			this.index = backtrack;
			return undefined;
		}
		const nai = this.tryParseCmavo("NAI");

		return {
			type: "gihek",
			na,
			se,
			giha,
			nai,
			...spanOf(na, se, giha, nai),
		};
	}

	protected tryParseEk(): Ek | undefined {
		const backtrack = this.index;
		const na = this.tryParseCmavo("NA");
		const se = this.tryParseCmavo("SE");
		const a = this.tryParseCmavo("A");
		if (a === undefined) {
			this.index = backtrack;
			return undefined;
		}
		const nai = this.tryParseCmavo("NAI");

		return {
			type: "ek",
			na,
			se,
			a,
			nai,
			...spanOf(na, se, a, nai),
		};
	}

	private tryParseSimpleTenseModal(): Stm | undefined {
		if (this.isAhead(among("KI", "CUhE"), "KI or CUhE")) {
			const kiOrCuhe = this.nextToken()!;
			return {
				type: "stm",
				...spanOf(kiOrCuhe),
				value: {
					type: "stm-cmavo",
					...spanOf(kiOrCuhe),
					kiOrCuhe: kiOrCuhe.index,
				},
			};
		}
		if (this.isAhead(seq(opt("NAhE"), opt("SE"), "BAI"), "BAI")) {
			const stmBai = this.parseStmBai();
			return {
				type: "stm",
				...spanOf(stmBai),
				value: stmBai,
			};
		}
		const stmTense = this.tryParseStmTense();
		if (stmTense) {
			return {
				type: "stm",
				...spanOf(stmTense),
				value: stmTense,
			};
		}
	}

	private parseStmBai(): StmBai {
		const nahe = this.tryParseCmavo("NAhE");
		const se = this.tryParseCmavo("SE");
		const bai = this.tryParseCmavo("BAI")!;
		const nai = this.tryParseCmavo("NAI");
		const ki = this.tryParseCmavo("KI");
		return {
			type: "stm-bai",
			...spanOf(nahe, se, bai, nai, ki),
			nahe,
			se,
			bai,
			nai,
			ki,
		};
	}

	private tryParseStmTense(): StmTense | undefined {
		const nahe = this.tryParseCmavo("NAhE");
		const tense = this.tryParseTimespace() ?? this.tryParseSpacetime();
		const caha = this.tryParseCmavo("CAhA");
		const ki = this.tryParseCmavo("KI");

		if (tense === undefined && caha === undefined) {
			return undefined;
		}

		return {
			type: "stm-tense",
			...spanOf(nahe, tense, caha, ki),
			nahe,
			tense,
			caha,
			ki,
		};
	}

	private tryParseTimespace(): Timespace | undefined {
		const time = this.tryParseTime();
		if (!time) return undefined;
		const space = this.tryParseSpace();
		return {
			type: "timespace",
			...spanOf(time, space),
			time,
			space,
		};
	}

	private tryParseSpacetime(): Spacetime | undefined {
		const space = this.tryParseSpace();
		if (space === undefined) return undefined;
		const time = this.tryParseTime();
		return {
			type: "spacetime",
			...spanOf(space, time),
			space,
			time,
		};
	}

	private tryParseTime(): Time | undefined {
		const backtrack = this.index;
		this.begin("time");
		let start: number | undefined;
		let end: number | undefined;

		const zi = this.tryParseCmavo("ZI");
		if (zi) {
			start ??= zi;
			end = zi;
		}

		const timeOffsets: TimeOffset[] = [];
		while (true) {
			const offset = this.tryParseTimeOffset();
			if (!offset) break;
			timeOffsets.push(offset);
			start ??= offset.start;
			end = offset.end;
		}

		const zehapu = this.tryParseZehapu();
		if (zehapu) {
			start ??= zehapu.start;
			end = zehapu.end;
		}

		const intervalProperties: IntervalProperty[] = [];
		while (true) {
			const property = this.tryParseIntervalProperty();
			if (!property) break;
			intervalProperties.push(property);
			start ??= property.start;
			end = property.end;
		}

		if (start !== undefined && end !== undefined) {
			return this.parsed("time", {
				type: "time" as const,
				start,
				end,
				zi,
				timeOffsets,
				zehapu,
				intervalProperties,
			});
		} else {
			this.index = backtrack;
			this.end();
			return undefined;
		}
	}

	private tryParseTimeOffset(): TimeOffset | undefined {
		const pu = this.tryParseCmavo("PU");
		if (pu === undefined) return undefined;
		const nai = this.tryParseCmavo("NAI");
		const zi = this.tryParseCmavo("ZI");
		return {
			type: "time-offset",
			...spanOf(pu, nai, zi),
			pu,
			nai,
			zi,
		};
	}

	private tryParseIntervalProperty(): IntervalProperty | undefined {
		const taheOrZaho = this.tryParseCmavo("TAhE") ?? this.tryParseCmavo("ZAhO");
		if (taheOrZaho !== undefined) {
			const nai = this.tryParseCmavo("NAI");
			return {
				type: "interval-property-cmavo",
				...spanOf(taheOrZaho, nai),
				taheOrZaho,
				nai,
			};
		}

		const backtrack = this.index;
		const number = this.tryParseNamcu();
		if (number === undefined) return undefined;
		const roi = this.tryParseCmavo("ROI");
		if (roi === undefined) {
			this.index = backtrack;
			return undefined;
		}
		const nai = this.tryParseCmavo("NAI");
		return {
			type: "interval-property-roi",
			...spanOf(number, roi, nai),
			number,
			roi,
			nai,
		};
	}

	private tryParseZehapu(): Zehapu | undefined {
		const zeha = this.tryParseCmavo("ZEhA");
		if (zeha === undefined) return undefined;
		const pu = this.tryParseCmavo("PU");
		const nai = pu ? this.tryParseCmavo("NAI") : undefined;
		return {
			type: "zehapu",
			...spanOf(zeha, pu, nai),
			zeha,
			pu,
			nai,
		};
	}

	private tryParseSpace(): Space | undefined {
		this.begin("space");
		const backtrack = this.index;
		let start: number | undefined;
		let end: number | undefined;

		const va = this.tryParseCmavo("VA");
		if (va !== undefined) {
			start ??= va;
			end = va;
		}

		const spaceOffsets: SpaceOffset[] = [];
		while (true) {
			const offset = this.tryParseSpaceOffset();
			if (!offset) break;
			spaceOffsets.push(offset);
			start ??= offset.start;
			end = offset.end;
		}
		const spaceIntervals: SpaceInterval[] = [];
		while (true) {
			const interval = this.tryParseSpaceInterval();
			if (!interval) break;
			spaceIntervals.push(interval);
			start ??= interval.start;
			end = interval.end;
		}

		const motion = this.tryParseMotion();
		if (motion !== undefined) {
			start ??= motion.start;
			end = motion.end;
		}

		if (start !== undefined && end !== undefined) {
			return this.parsed("space", {
				type: "space" as const,
				start,
				end,
				va,
				spaceOffsets,
				spaceIntervals,
				motion,
			});
		} else {
			this.index = backtrack;
			this.end();
			return undefined;
		}
	}

	private tryParseMotion(): Motion | undefined {
		const mohi = this.tryParseCmavo("MOhI");
		if (mohi === undefined) return undefined;
		const spaceOffset = this.tryParseSpaceOffset();
		if (spaceOffset === undefined) {
			throw new ParseError("bad motion");
		}
		return {
			type: "motion",
			...spanOf(mohi, spaceOffset),
			mohi,
			spaceOffset,
		};
	}

	private tryParseSpaceOffset(): SpaceOffset | undefined {
		const faha = this.tryParseCmavo("FAhA");
		if (faha === undefined) return undefined;
		const nai = this.tryParseCmavo("NAI");
		const va = this.tryParseCmavo("VA");
		return {
			type: "space-offset",
			...spanOf(faha, nai, va),
			faha,
			nai,
			va,
		};
	}

	private tryParseSpaceInterval(): SpaceInterval | undefined {
		const vxha = this.tryParseVxha();
		const spaceIntProps: SpaceIntProp[] = [];
		while (true) {
			const next = this.tryParseSpaceIntProp();
			if (!next) break;

			spaceIntProps.push(next);
		}
		if (vxha !== undefined || spaceIntProps.length) {
			return {
				type: "space-interval",
				...spanOf(vxha, spaceIntProps),
				vxha,
				spaceIntProps,
			};
		}
	}

	private tryParseVxha(): Vxha | undefined {
		const veha = this.tryParseCmavo("VEhA");
		const viha = this.tryParseCmavo("VIhA");
		if ((veha ?? viha) === undefined) return undefined;
		const faha = this.tryParseCmavo("FAhA");
		const nai = faha ? this.tryParseCmavo("NAI") : undefined;
		return {
			type: "vxha",
			...spanOf(veha, viha, faha, nai),
			veha,
			viha,
			faha,
			nai,
		};
	}

	private tryParseSpaceIntProp(): SpaceIntProp | undefined {
		const fehe = this.tryParseCmavo("FEhE");
		if (fehe === undefined) return undefined;
		const intervalProperty = this.tryParseIntervalProperty();
		if (intervalProperty === undefined) {
			throw new ParseError("bad space-int-prop");
		}
		return {
			type: "space-int-prop",
			start: fehe,
			end: intervalProperty.end,
			fehe,
			intervalProperty,
		};
	}
}
