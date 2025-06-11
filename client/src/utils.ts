import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";

import { useStore } from "@nanostores/preact";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import type { CalendarType } from "@schedule-x/calendar";

import { IApiShortEvent } from "./api";
import { $profile, $tz, IStorePrifile, TStorePrifile } from "./store/profile";

export const EVENT_FORMAT = "YYYY-MM-DD HH:mm";
export const YYYY_MM_DD = "YYYY-MM-DD";
export const DEFAULT_EVENT_DURATION = 4;

dayjs.extend(utc);
dayjs.extend(timezone);

export const navBack = () => history.back();

/**
 * Универсальный хук для проверки состояния и редиректа
 */
const useAuthCheck = (
	checkFn: (profile: TStorePrifile | null) => boolean,
	redirectPath: string,
) => {
	const profile = useStore($profile);
	const [isLoading, setIsLoading] = useState(true);
	const [shouldRedirect, setShouldRedirect] = useState(false);

	useEffect(() => {
		const unsubscribe = $profile.listen((p) => {
			setIsLoading(false);
			if (!checkFn(p ?? null)) {
				setShouldRedirect(true);
			}
		});

		return unsubscribe;
	}, [checkFn]);

	useEffect(() => {
		if (shouldRedirect && window.location.pathname !== redirectPath) {
			route(redirectPath, true);
			setShouldRedirect(false);
		}
	}, [shouldRedirect, redirectPath]);

	useEffect(() => {
		if (!isLoading && profile && !checkFn(profile)) {
			setShouldRedirect(true);
		}
	}, [profile, isLoading, checkFn]);

	return {
		isAllowed: profile ? checkFn(profile) : false,
		isLoading,
	};
};

/**
 * Хук для проверки авторизации
 */
export const useAuthGuard = () => {
	const { isAllowed, isLoading } = useAuthCheck(
		(profile) => !!profile?.signed,
		"/signin",
	);

	return { isAuthenticated: isAllowed, isLoading };
};

/**
 * Хук для проверки верификации пользователя (email или telegram)
 */
export const useVerificationGuard = () => {
	const { isAllowed } = useAuthCheck((profile) => !!profile?.verified, "/");

	return { isVerified: isAllowed };
};

/**
 * Комбинированный хук для защиты страниц
 */
export const useAuthVerification = () => {
	const profile = useStore($profile);
	const { isAuthenticated, isLoading } = useAuthGuard();
	const { isVerified } = useVerificationGuard();
	const [shouldRedirect, setShouldRedirect] = useState(false);

	useEffect(() => {
		if (!isLoading && !isAuthenticated && window.location.pathname !== "/") {
			setShouldRedirect(true);
		}
	}, [isAuthenticated, isLoading]);

	useEffect(() => {
		if (shouldRedirect) {
			route("/", true);
			setShouldRedirect(false);
		}
	}, [shouldRedirect]);

	return {
		profile: isAuthenticated ? (profile as IStorePrifile) : null,
		isAuthenticated,
		isVerified: isAuthenticated ? isVerified : null,
		isLoading,
		reset: () => window.location.reload(),
	};
};

export const calcMapIconLink = (mapLink: string | null | undefined): string => {
	if (!mapLink) {
		return "";
	} else if (mapLink.startsWith("https://2gis.ru/")) {
		return "/assets/2gis.svg";
	} else if (mapLink.startsWith("https://yandex.ru/maps/")) {
		return "/assets/ym.svg";
	} else if (
		mapLink.startsWith("https://google.ru/maps/") ||
		mapLink.startsWith("https://www/google.ru/maps/") ||
		mapLink.startsWith("https://google.com/maps/") ||
		mapLink.startsWith("https://www.google.com/maps/")
	) {
		return "/assets/gm.svg";
	} else {
		return "";
	}
};

/**
 * Хуки для форматирования даты
 */
export const useEventTime = () => {
	const tz = useStore($tz);

	const parseWithTz = (dateStr: string) => dayjs.tz(dateStr, EVENT_FORMAT, tz);

	const formatWithTz = (dateStr: string) =>
		parseWithTz(dateStr).format(EVENT_FORMAT);

	const getEventEnd = (start: dayjs.Dayjs, durationHours: number) => {
		const end = start.add(durationHours, "h");
		return end.isSame(start, "day") ? end : start.endOf("day");
	};

	const formatEvent = (apiEvent: IApiShortEvent) => {
		const start = parseWithTz(apiEvent.date);
		const end = getEventEnd(
			start,
			apiEvent.plan_duration ?? DEFAULT_EVENT_DURATION,
		);
		return {
			id: apiEvent.id,
			title: apiEvent.company,
			start: start.format(EVENT_FORMAT),
			end: end.format(EVENT_FORMAT),
		};
	};

	return {
		tz,
		EVENT_FORMAT,
		parseWithTz,
		formatWithTz,
		getEventEnd,
		formatEvent,
	};
};

const HEX_COLOR_PREFIX = "#";

export interface IEventStyle {
	readonly background: string;
	readonly highlight: string;
	readonly text: string;
}

export const DEFAULT_EVENT_STYLE: IEventStyle = {
	background: "var(--sx-color-primary-container)",
	highlight: "var(--sx-color-primary)",
	text: "var(--sx-color-on-primary-container)",
};

export const parseEventStyle = (style: string): IEventStyle => {
	const [, highlight, background, text] = style.split(HEX_COLOR_PREFIX);

	return {
		background: HEX_COLOR_PREFIX + background,
		highlight: HEX_COLOR_PREFIX + highlight,
		text: HEX_COLOR_PREFIX + text,
	};
};

export const convertEventStyleToCSS = (style: string | null | undefined) => {
	const { highlight, background, text } = style
		? parseEventStyle(style)
		: DEFAULT_EVENT_STYLE;

	return {
		backgroundColor: background,
		borderLeft: `4px solid ${highlight}`,
		color: text,
	};
};

export const convertEventStyleToCalendarType = (
	style: string,
): CalendarType => {
	const { highlight, background, text } = parseEventStyle(style);

	const color = {
		main: highlight,
		container: background,
		onContainer: text,
	};

	return {
		colorName: style.replaceAll(HEX_COLOR_PREFIX, ""),
		lightColors: color,
		darkColors: color,
	};
};

export const stringifyEventStyle = (style: IEventStyle): string =>
	`${style.highlight}${style.background}${style.text}`;

export const escapeCalendarId = (style: string) =>
	style.replaceAll(HEX_COLOR_PREFIX, "");