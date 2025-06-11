import type { UUID } from "node:crypto";

import "dayjs/locale/ru";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { atom, computed, map, task } from "nanostores";
import { procetar } from "procetar";

import { API_HOST, ETzVariant, getTgAvatar, IApiProfile } from "../api";
import { toaster } from "../components/ui/toaster";
import { YYYY_MM_DD } from "../utils";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("ru");

// --== User ==--

export interface IStorePrifile {
	readonly id: UUID;
	readonly email: string | null;
	readonly email_verified: boolean;
	readonly nickname: string;
	readonly about_me: string | null;
	readonly city: string | null;
	readonly region: string | null;
	readonly timezone_offset: number | null;
	readonly tz_variant: ETzVariant | null;
	readonly signed: true;
	readonly verified: boolean;
}

export interface IEmptyStorePrifile {
	readonly id: undefined;
	readonly email: undefined;
	readonly email_verified: undefined;
	readonly nickname: undefined;
	readonly about_me: undefined;
	readonly city: undefined;
	readonly region: undefined;
	readonly timezone_offset: undefined;
	readonly tz_variant: undefined;
	readonly signed: false;
	readonly verified: undefined;
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

		const prof: IStorePrifile = {
			id: p.id,
			email: p.email,
			email_verified: p.email_verified,
			nickname: p.nickname,
			about_me: p.about_me,
			city: p.city,
			region: p.region,
			timezone_offset: p.timezone_offset,
			tz_variant: p.tz_variant,
			signed: true,
			verified: p.email_verified || Boolean(p.tg_id),
		};

		return prof;
	}),
);
export const enter = (profile: IApiProfile) => _profile.set(profile);
export const leave = () => {
	_profile.set(EMPTY_USER);
	URL.revokeObjectURL(_tgAvatarLink.get());
	_tgAvatarLink.set("");
};

// --== AVATAR ==--
const _tgAvatarLink = atom("");
export const setFromTgAuthorization = (tgAvatarLink: string) =>
	_tgAvatarLink.set(tgAvatarLink);

export const $avatarLink = computed([_profile, _tgAvatarLink], (p, tg) =>
	task(async () => {
		if ("avatar_link" in p && p.avatar_link) {
			return {
				link: API_HOST + p.avatar_link,
				source: "Аватар установлен пользователем",
			};
		}

		if (tg) {
			const tgPhotoRes = await getTgAvatar(tg).catch(() => null);
			if (tgPhotoRes && tgPhotoRes.ok) {
				const tgPhotoBuf = await tgPhotoRes.blob().catch(() => null);
				if (tgPhotoBuf) {
					return {
						link: URL.createObjectURL(tgPhotoBuf),
						source: "Аватар из Telegram",
					};
				}
			}
		}

		if ("id" in p) {
			const gen = await procetar(p.id);
			return {
				link: gen,
				source: "Сгенерированный аватар",
			};
		}

		return undefined;
	}),
);

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

// --== SSE ==--
let eventSource: EventSource | null = null;
const DATE_REGEXP = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/;

$profile.listen((p) => {
	if (p?.signed) {
		eventSource = new EventSource(API_HOST + "/api/sse", {
			withCredentials: true,
		});

		eventSource.onmessage = (event) => {
			let msg: string = event.data;
			const match = msg.match(DATE_REGEXP)?.[0];
			if (match) {
				const date = dayjs(match).tz($tz.get()).format(YYYY_MM_DD);
				msg = msg.replace(match, date);
			}
			toaster.success({ title: msg });
		};

		eventSource.onerror = (event) => {
			console.info("sse error:");
			console.error(event);
		};
	} else {
		eventSource?.close();
		eventSource = null;
	}
});
