import type { UUID } from "node:crypto";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { atom, computed, map } from "nanostores";

import { IApiProfile } from "../api";

dayjs.extend(utc);
dayjs.extend(timezone);

const proxy = <T>(v: T) => v;

// --== Mastery ==--
const MASTERY_KEY = "nri_mastery";
const TRUE = "true";

const _mastery = atom(localStorage.getItem(MASTERY_KEY) === TRUE);
export const $mastery = computed(_mastery, proxy);

export const enableMastery = () => {
	localStorage.setItem(MASTERY_KEY, TRUE);
	_mastery.set(true);
};

export const disableMastery = () => {
	localStorage.removeItem(MASTERY_KEY);
	_mastery.set(false);
};

// --== User ==--

const EMPTY_USER = {};

export interface IStorePrifile {
	readonly id: UUID;
	readonly email: string | null;
	readonly nickname: string;
	readonly about_me: string | null;
	readonly avatar_link: string | null;
	readonly city: string | null;
}

export type TStorePrifile = IStorePrifile | typeof EMPTY_USER;

const _profile = map<IApiProfile | typeof EMPTY_USER>(EMPTY_USER);
export const $profile = computed(_profile, (p) => {
	if (!("id" in p)) {
		return p as TStorePrifile;
	}

	return {
		id: p.id,
		email: p.email,
		nickname: p.nickname,
		about_me: p.about_me,
		avatar_link: p.avatar_link,
		city: p.city,
	};
});
export const enter = (profile: IApiProfile) => _profile.set(profile);
export const leave = () => _profile.set(EMPTY_USER);

// --== Signed ==--

export const $signed = computed(_profile, (p) => "id" in p);

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
	if (p.get_tz_from_device) {
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
