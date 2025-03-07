import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { atom, ReadableAtom, WritableAtom } from "nanostores";

dayjs.extend(utc);
dayjs.extend(timezone);

/** @todo добавить все временные зоны */
const TIMEZONES = {
	2: "Europe/Kaliningrad",
	3: "Europe/Moscow",
	4: "Europe/Samara",
	5: "Asia/Yekaterinburg",
	6: "Asia/Omsk",
	7: "Asia/Krasnoyarsk",
	8: "Asia/Irkutsk",
	9: "Asia/Yakutsk",
	10: "Asia/Vladivostok",
	11: "Asia/Magadan",
	12: "Asia/Kamchatka",
} as const;

export const $tz: ReadableAtom<string> = atom(dayjs.tz.guess());

export const setOffset = (offset: number) => {
	if (!(offset in TIMEZONES)) {
		console.error("Передано кривое смещение временной зоны", offset);
		return;
	}

	const timeZone = TIMEZONES[offset as keyof typeof TIMEZONES];
	($tz as WritableAtom<string>).set(timeZone);
};

export const resetOffset = () => {
	($tz as WritableAtom<string>).set(dayjs.tz.guess());
};
