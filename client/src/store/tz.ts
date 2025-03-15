import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { atom, ReadableAtom, WritableAtom } from "nanostores";

dayjs.extend(utc);
dayjs.extend(timezone);

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

export const $tz: ReadableAtom<string> = atom(dayjs.tz.guess());

export const setOffset = (
	offset: number | null,
	get_tz_from_device: boolean,
) => {
	if (get_tz_from_device) {
		($tz as WritableAtom<string>).set(dayjs.tz.guess());
		return;
	}

	if (typeof offset === "number") {
		const timeZone = TIMEZONES.get(offset);

		if (!timeZone) {
			console.error("Передано кривое смещение временной зоны", offset);
			return;
		}

		($tz as WritableAtom<string>).set(timeZone);
	}
};

export const resetOffset = () => {
	($tz as WritableAtom<string>).set(dayjs.tz.guess());
};
