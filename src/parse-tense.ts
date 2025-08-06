/** biome-ignore-all lint/style/noNonNullAssertion: Useful */

import { ParseError } from "./error";
import type {
	IntervalProperty,
	Motion,
	SimpleTenseModal,
	Space,
	SpaceInterval,
	SpaceIntProp,
	SpaceOffset,
	Spacetime,
	StmBai,
	StmTense,
	TenseModal,
	Time,
	TimeOffset,
	Timespace,
	Vxha,
	Zehapu,
} from "./grammar";
import { BaseParser } from "./parse-base";
import type { Token } from "./tokenize";

export class TenseParser extends BaseParser {
	constructor(tokens: Token[], index: number = 0) {
		super(tokens);
		this.index = index;
	}

	public parseTenseModal(): TenseModal {
		const simpleTenseModal = this.parseSimpleTenseModal();
		const frees = this.parseFrees();
		return {
			type: "tense-modal",
			start: simpleTenseModal.start,
			end: simpleTenseModal.end,
			first: simpleTenseModal,
			frees,
		};
	}

	private parseSimpleTenseModal(): SimpleTenseModal {
		if (this.isAhead(["KI"]) || this.isAhead(["CUhE"])) {
			const kiOrCuhe = this.nextToken()!;
			return {
				type: "stm-cmavo",
				start: kiOrCuhe.index,
				end: kiOrCuhe.index,
				kiOrCuhe: kiOrCuhe.index,
			};
		}
		if (
			this.isAhead(["NAhE", "SE", "BAI"]) ||
			this.isAhead(["NAhE", "BAI"]) ||
			this.isAhead(["SE"]) ||
			this.isAhead(["BAI"])
		) {
			return this.parseStmBai();
		}
		return this.parseStmTense();
	}

	private parseStmBai(): StmBai {
		const nahe = this.tryParseCmavo("NAhE");
		const se = this.tryParseCmavo("SE");
		const bai = this.tryParseCmavo("BAI")!;
		const nai = this.tryParseCmavo("NAI");
		const ki = this.tryParseCmavo("KI");
		return {
			type: "stm-bai",
			start: nahe ?? se ?? bai,
			end: ki ?? nai ?? bai,
			nahe,
			se,
			bai,
			nai,
			ki,
		};
	}

	private parseStmTense(): StmTense {
		const nahe = this.tryParseCmavo("NAhE");
		const tense = this.tryParseTimespace() ?? this.tryParseSpacetime();
		const caha = this.tryParseCmavo("CAhA");
		const ki = this.tryParseCmavo("KI");

		if (!tense && !caha) {
			console.log({ nahe, tense, caha, ki });
			// We should never hit this because we predict it
			throw new ParseError("Bad stm-tense", this.index);
		}

		return {
			type: "stm-tense",
			start: (nahe ?? tense?.start ?? caha)!,
			end: (ki ?? caha ?? tense?.end)!,
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
			start: time.start,
			end: space?.end ?? time.end,
			time,
			space,
		};
	}

	private tryParseSpacetime(): Spacetime | undefined {
		const space = this.tryParseSpace();
		if (!space) return undefined;
		const time = this.tryParseTime();
		return {
			type: "spacetime",
			start: space.start,
			end: time?.end ?? space.end,
			space,
			time,
		};
	}

	private tryParseTime(): Time | undefined {
		const backtrack = this.index;
		let start: number | undefined;
		let end: number | undefined;

		const zi = this.tryParseCmavoWithFrees("ZI");
		if (zi) {
			start ??= zi.start;
			end = zi.end;
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
			return {
				type: "time",
				start,
				end,
				zi,
				timeOffsets,
				zehapu,
				intervalProperties,
			};
		} else {
			this.index = backtrack;
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
			start: pu,
			end: zi ?? nai ?? pu,
			pu,
			nai,
			zi,
		};
	}

	private tryParseIntervalProperty(): IntervalProperty | undefined {
		const taheOrZaho = this.tryParseCmavo("TAhE") ?? this.tryParseCmavo("ZAhO");
		if (taheOrZaho) {
			const nai = this.tryParseCmavo("NAI");
			return {
				type: "interval-property-cmavo",
				start: taheOrZaho,
				end: nai ?? taheOrZaho,
				taheOrZaho,
				nai,
			};
		}

		const backtrack = this.index;
		const number = this.tryParseNamcu();
		if (!number) return undefined;
		const roi = this.tryParseCmavo("ROI");
		if (!roi) {
			this.index = backtrack;
			return undefined;
		}
		const nai = this.tryParseCmavo("NAI");
		return {
			type: "interval-property-roi",
			start: number.start,
			end: nai ?? roi,
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
			start: zeha,
			end: nai ?? pu ?? zeha,
			zeha,
			pu,
			nai,
		};
	}

	private tryParseSpace(): Space | undefined {
		const backtrack = this.index;
		let start: number | undefined;
		let end: number | undefined;

		const va = this.tryParseCmavoWithFrees("VA");
		if (va !== undefined) {
			start ??= va.start;
			end = va.end;
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
			return {
				type: "space",
				start,
				end,
				va,
				spaceOffsets,
				spaceIntervals,
				motion,
			};
		} else {
			this.index = backtrack;
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
			start: mohi,
			end: spaceOffset?.end ?? mohi,
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
			start: faha,
			end: va ?? nai ?? faha,
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
		if (vxha !== undefined && spaceIntProps.length) {
			return {
				type: "space-interval",
				start: vxha.start,
				end: spaceIntProps.length
					? spaceIntProps[spaceIntProps.length - 1].end
					: vxha.end,
				vxha,
				spaceIntProps,
			};
		}
	}

	private tryParseVxha(): Vxha | undefined {
		const veha = this.tryParseCmavo("VEhA");
		const viha = this.tryParseCmavo("VIhA");
		const first = veha ?? viha;
		if (first === undefined) return undefined;
		const faha = this.tryParseCmavo("FAhA");
		const nai = faha ? this.tryParseCmavo("NAI") : undefined;
		return {
			type: "vxha",
			start: first,
			end: nai ?? faha ?? viha ?? first,
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
