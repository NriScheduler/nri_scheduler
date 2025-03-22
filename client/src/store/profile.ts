import type { UUID } from "node:crypto";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { computed, map, task } from "nanostores";
import { procetar } from "procetar";

import { API_HOST, ETzVariant, IApiProfile } from "../api";

dayjs.extend(utc);
dayjs.extend(timezone);

// --== User ==--

export interface IStorePrifile {
	readonly id: UUID;
	readonly email: string | null;
	readonly nickname: string;
	readonly about_me: string | null;
	readonly avatar_link: string;
	readonly city: string | null;
	readonly region: string | null;
	readonly timezone_offset: number | null;
	readonly tz_variant: ETzVariant | null;
	readonly signed: true;
}

export interface IEmptyStorePrifile {
	readonly id: undefined;
	readonly email: undefined;
	readonly nickname: undefined;
	readonly about_me: undefined;
	readonly avatar_link: undefined;
	readonly city: undefined;
	readonly region: undefined;
	readonly timezone_offset: undefined;
	readonly tz_variant: undefined;
	readonly signed: false;
}

const EMPTY_USER = {};

export type TStorePrifile = IStorePrifile | IEmptyStorePrifile;

const _profile = map<IApiProfile | typeof EMPTY_USER>(EMPTY_USER);

export const $profile = computed(_profile, (p) =>
	task(async () => {
		if (!("id" in p)) {
			const { avatar_link } = _profile.get() as IApiProfile;
			URL.revokeObjectURL(avatar_link as string);
			return { signed: false } as TStorePrifile;
		}

		const avatar_link = p.avatar_link
			? API_HOST + p.avatar_link
			: await procetar(p.id);

		const prof: IStorePrifile = {
			id: p.id,
			email: p.email,
			nickname: p.nickname,
			about_me: p.about_me,
			avatar_link,
			city: p.city,
			region: p.region,
			timezone_offset: p.timezone_offset,
			tz_variant: p.tz_variant,
			signed: true,
		};

		return prof;
	}),
);
export const enter = (profile: IApiProfile) => _profile.set(profile);
export const leave = () => _profile.set(EMPTY_USER);

// --== TZ ==--
export const TIMEZONES: ReadonlyMap<number, string> = new Map([
	[2, "Europe/Kaliningrad"],
	[3, "Europe/Moscow"],
	[4, "Europe/Samara"],
	[5, "Asia/Yekaterinburg"],
	[6, "Asia/Omsk"],
	[7, "Asia/Krasnoyarsk"],
	[8, "Asia/Irkutsk"],
	[9, "Asia/Yakutsk"],
	[10, "Asia/Vladivostok"],
	[11, "Asia/Magadan"],
	[12, "Asia/Kamchatka"],

	[1, "Europe/Berlin"],
	[0, "Europe/London"],
	[-1, "Atlantic/Cape_Verde"],
	[-2, "America/Noronha"],
	[-3, "America/Argentina/Buenos_Aires"],
	[-4, "America/Halifax"],
	[-5, "America/New_York"],
	[-6, "America/Chicago"],
	[-7, "America/Denver"],
	[-8, "America/Los_Angeles"],
	[-9, "America/Anchorage"],
	[-10, "Pacific/Honolulu"],
	[-11, "Pacific/Pago_Pago"],
]);

export const $tz = computed(_profile, (p: Partial<IApiProfile>) => {
	if (p.get_tz_from_device || typeof p.timezone_offset !== "number") {
		return dayjs.tz.guess();
	}

	const timeZone = TIMEZONES.get(p.timezone_offset as number);
	if (timeZone) {
		return timeZone;
	}

	console.error(
		"Передано некорректное смещение временной зоны",
		p.timezone_offset,
	);
	return dayjs.tz.guess();
});
