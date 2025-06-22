import type { UUID } from "node:crypto";

import { route as navigate } from "preact-router";

import { toaster } from "./components/ui/toaster";
import { enter, leave, setFromTgAuthorization } from "./store/profile";
import { ITelegramUser } from "./typings/telegram";

export const API_HOST = import.meta.env.PROD
	? ""
	: (import.meta.env.CLIENT_API_HOST as string | undefined) || "";
const CREDENTIALS = import.meta.env.PROD ? undefined : "include";

export const TG_BOT_ID = import.meta.env.CLIENT_TG_BOT_ID as string | undefined;

const POST = "POST";
const PUT = "PUT";
const URL_ENCODED = true;

export const enum EAbortReason {
	TIMEOUT = "timeout",
	UNMOUNT = "unmount",
}

export const enum EScenarioStatus {
	SCENARIO_SUCCESS = 0,
	SCENARIO_FAIL = 400,
	UNAUTHORIZED = 401,
	SESSION_EXPIRED = 419,
	SYSTEM_ERROR = 500,
}

export interface IApiResponse<T = null> {
	readonly status: EScenarioStatus;
	readonly result: string;
	readonly payload: T;
}

export interface IRequestInit {
	readonly body?: string | FormData | URLSearchParams;
	readonly headers?: Record<string, string>;
	readonly method?: string;
	readonly timeoutMilliseconds?: number;
}

const ajax = <T>(
	input: string,
	init?: IRequestInit | null,
	abort?: AbortController,
	isSoft = false,
): Promise<IApiResponse<T> | null> => {
	let controller = abort;
	let timeoutId: ReturnType<typeof setTimeout>;

	if (init?.timeoutMilliseconds) {
		controller = controller || new AbortController();
		timeoutId = setTimeout(
			() => controller!.abort(EAbortReason.TIMEOUT),
			init.timeoutMilliseconds,
		);
	}

	return fetch(API_HOST + input, {
		body: init?.body,
		cache: "no-store",
		credentials: CREDENTIALS,
		headers: init?.headers,
		method: init?.method,
		signal: controller?.signal,
	})
		.then((res) => checkResponse<T>(res, isSoft))
		.catch((err) => {
			if (controller && controller.signal.aborted) {
				if (controller.signal.reason === EAbortReason.TIMEOUT) {
					toaster.error({
						title: "Истекло время ожидания ответа сервера",
					});
					return null;
				} else if (controller.signal.reason === EAbortReason.UNMOUNT) {
					// just ignore it
					return null;
				}
			}

			toaster.error({ title: "Неизвестная ошибка" });
			console.info("Хрень какая-то...");
			console.error(err);

			return null;
		})
		.finally(() => {
			clearTimeout(timeoutId);
		});
};

const checkResponse = async <T>(
	response: Response,
	isSoft: boolean,
): Promise<IApiResponse<T> | null> => {
	if (response.ok === false) {
		let body: object | string | null = null;

		try {
			body = await response.text();
			try {
				const parsed = JSON.parse(body);
				body = parsed;
			} catch {
				// payload is not a json string
			}
		} catch (err) {
			console.info("http response body parsing error");
			console.error(err);
		}
		toaster.error({ title: "Ошибка обращения к серверу" });
		console.info("Http response is not ok");
		console.error({
			status: response.status,
			statusText: response.statusText,
			body,
		});

		return null;
	}

	try {
		const apiRes: IApiResponse<T> = await response.json();

		switch (apiRes.status) {
			case EScenarioStatus.SCENARIO_SUCCESS:
				return apiRes;

			case EScenarioStatus.UNAUTHORIZED:
			case EScenarioStatus.SESSION_EXPIRED:
				/** @todo добавить refresh */
				leave();
				if (!isSoft) {
					toaster.error({ title: apiRes.result });
					navigate("/signin");
				}

				break;

			case EScenarioStatus.SCENARIO_FAIL:
			case EScenarioStatus.SYSTEM_ERROR:
				toaster.error({ title: apiRes.result });
				break;

			default:
				toaster.error({ title: "Неизвестный статус ответа" });
				console.info("Неизвестный статус");
				console.error(apiRes);
				break;
		}

		return null;
	} catch (err) {
		if (err instanceof Error && err.name === "AbortError") {
			toaster.warning({ title: "Истекло время ожидания ответа сервера" });
		} else {
			toaster.error({ title: "Неизвестная ошибка" });
			console.info("Хрень какая-то...");
			console.error(err);
		}
		return null;
	}
};

const prepareAjax = (
	payload?: object,
	method?: string,
	urlencoded = false,
): IRequestInit => {
	return {
		body: payload
			? urlencoded
				? new URLSearchParams(payload as Record<string, string>)
				: JSON.stringify(payload)
			: undefined,
		headers: payload
			? {
					"Content-Type":
						"application/" +
						(urlencoded ? "x-www-form-urlencoded" : "json"),
				}
			: undefined,
		method,
	};
};

export const registration = (
	nickname: string,
	email: string,
	password: string,
) => {
	return ajax<null>(
		"/api/registration",
		prepareAjax({ nickname, email, password }, POST, URL_ENCODED),
	);
};

export const signIn = (email: string, password: string) => {
	return ajax<null>(
		"/api/signin",
		prepareAjax({ email, password }, POST, URL_ENCODED),
	);
};

export const signInTg = (data: ITelegramUser) => {
	return ajax<null>("/api/signin/tg", prepareAjax(data, POST)).then((res) => {
		if (res && data.photo_url) {
			setFromTgAuthorization(data.photo_url);
		}
		return res;
	});
};

export const logout = () =>
	ajax<null>("/api/logout", prepareAjax(undefined, POST)).then((res) => {
		if (res) {
			leave();
		}

		return res;
	});

export const enum EVerificationChannel {
	EMAIL = "email",
}

export const verifyEmail = (code: string) => {
	return ajax<null>(
		"/api/verify",
		prepareAjax({ code, channel: EVerificationChannel.EMAIL }, POST),
	);
};

export const sendVerificationLink = () =>
	ajax<null>(
		"/api/profile/send-email-verification",
		prepareAjax(undefined, POST),
	);

export interface IApiLocation {
	readonly id: UUID;
	readonly name: string;
	readonly address: string | null;
	readonly description: string | null;
	readonly region: string | null;
	readonly city: string | null;
	readonly map_link: string | null;
}

export const readLocations = (nameFilter?: string | null) => {
	const query = new URLSearchParams();
	if (nameFilter) {
		query.append("name", nameFilter);
	}

	return ajax<ReadonlyArray<IApiLocation>>(`/api/locations?${query}`);
};

export const readLocationById = (locId: UUID) =>
	ajax<IApiLocation>(`/api/locations/${locId}`);

export const addLocation = (
	name: string,
	address?: string | null,
	description?: string | null,
	city?: string | null,
	map_link?: string | null,
) =>
	ajax<UUID>(
		"/api/locations",
		prepareAjax({ name, address, description, city, map_link }, POST),
	);

export interface IApiCompany {
	readonly id: UUID;
	readonly master: UUID;
	readonly name: string;
	readonly system: string;
	readonly description: string | null;
	readonly cover_link: string | null;
}

export interface IApiStyledCompany {
	readonly id: UUID;
	readonly master: UUID;
	readonly name: string;
	readonly system: string;
	readonly description: string | null;
	readonly cover_link: string | null;
	readonly event_style: string | null;
}

export interface IApiCompanyInfo {
	readonly id: UUID;
	readonly master: UUID;
	readonly name: string;
	readonly master_name: string;
	readonly system: string;
	readonly description: string | null;
	readonly cover_link: string | null;
	readonly you_are_master: boolean;
	readonly event_style: string | null;
}

export const readMyCompanies = (
	nameFilter?: string | null,
	abortController?: AbortController,
) => {
	const query = new URLSearchParams();
	if (nameFilter) {
		query.append("name", nameFilter);
	}

	return ajax<ReadonlyArray<IApiCompany>>(
		`/api/companies/my?${query}`,
		undefined,
		abortController,
	);
};

export const readCompanyById = (companyId: UUID) =>
	ajax<IApiCompanyInfo>(`/api/companies/${companyId}`);

export const addCompany = (
	name: string,
	system: string,
	data: Partial<
		Omit<
			IApiStyledCompany,
			"id" | "master" | "name" | "system" | "cover_link"
		>
	>,
) => ajax<UUID>("/api/companies", prepareAjax({ name, system, ...data }, POST));

export const updateCompany = (
	companyId: UUID,
	data: Partial<Omit<IApiStyledCompany, "id" | "master" | "cover_link">>,
) => {
	return ajax<null>(`/api/companies/${companyId}`, prepareAjax(data, PUT));
};

export const setCompanyCover = (companyId: UUID, url: string) =>
	ajax<null>(`/api/companies/${companyId}/cover`, prepareAjax({ url }, PUT));

export interface IApiShortEvent {
	readonly id: UUID;
	readonly company: string;
	readonly date: string;
	readonly plan_duration: number | null;
	readonly style: string | null;
}

export interface IApiEvent {
	readonly id: UUID;
	readonly company: string;
	readonly company_id: UUID;
	readonly master: string;
	readonly master_id: UUID;
	readonly location: string;
	readonly location_id: UUID;
	readonly location_map_link: string | null;
	readonly date: string;
	readonly max_slots: number | null;
	readonly plan_duration: number | null;
	readonly players: ReadonlyArray<readonly [userId: UUID, nickName: string]>;
	readonly you_applied: boolean;
	readonly you_are_master: boolean;
	readonly your_approval: boolean | null;
	readonly cancelled: boolean;
}

export interface IEventsFilter {
	master?: UUID | null;
	location?: UUID | null;
	region?: string | null;
	city?: string | null;
	applied?: boolean | null;
	not_rejected?: boolean | null;
	imamaster?: boolean | null;
	company?: UUID[] | null;
}

export const readEventsList = (
	date_from: string,
	date_to: string,
	filters?: IEventsFilter | null,
) => {
	const query: Record<string, string> = { date_from, date_to };

	if (filters) {
		Object.entries(filters).forEach(([key, val]) => {
			if (val !== null && val !== undefined && val !== "") {
				query[key] = Array.isArray(val) ? val.join() : val;
			}
		});
	}

	return ajax<ReadonlyArray<IApiShortEvent>>(
		`/api/events?${new URLSearchParams(query)}`,
	);
};

export const readEvent = (eventId: UUID) => {
	return ajax<IApiEvent>(`/api/events/${eventId}`);
};

export const createEvent = (
	company: UUID,
	date: string,
	location: UUID,
	max_slots: number | null,
	plan_duration: number | null,
) => {
	return ajax<UUID>(
		"/api/events",
		prepareAjax({ company, date, location, max_slots, plan_duration }, POST),
	);
};

export const applyEvent = (eventId: UUID) => {
	return ajax<UUID>(
		`/api/events/apply/${eventId}`,
		prepareAjax(undefined, POST),
	);
};

export const updateEvent = (
	eventId: UUID,
	date: string,
	location: UUID,
	max_slots: number | null,
	plan_duration: number | null,
) => {
	return ajax<null>(
		`/api/events/${eventId}`,
		prepareAjax({ date, location, max_slots, plan_duration }, PUT),
	);
};

export const cancelEvent = (eventId: UUID) => {
	return ajax<null>(
		`/api/events/cancel/${eventId}`,
		prepareAjax(undefined, POST),
	);
};

export const reopenEvent = (eventId: UUID) => {
	return ajax<null>(
		`/api/events/reopen/${eventId}`,
		prepareAjax(undefined, POST),
	);
};

export interface IPlayerApp {
	readonly approval: boolean | null;
	readonly company_id: UUID;
	readonly company_name: string;
	readonly event_cancelled: boolean;
	readonly event_date: string; // "2025-04-15T07:24:00Z"
	readonly event_id: UUID;
	readonly id: UUID;
	readonly location_id: UUID;
	readonly location_name: string;
	readonly master_id: UUID;
	readonly master_name: string;
}

export const readPlayerAppsList = (abortController?: AbortController) =>
	ajax<ReadonlyArray<IPlayerApp>>(`/api/apps`, null, abortController);
export const readPlayerApp = (appId: UUID) =>
	ajax<IPlayerApp | null>(`/api/apps/${appId}`);
export const readPlayerAppByEvent = (eventId: UUID) =>
	ajax<IPlayerApp | null>(`/api/apps/by_event/${eventId}`);
export const readPlayerAppCompanyClosest = (companyId: UUID) =>
	ajax<IPlayerApp | null>(`/api/apps/company_closest/${companyId}`);

export interface IMasterApp {
	readonly approval: boolean | null;
	readonly company_id: UUID;
	readonly company_name: string;
	readonly event_cancelled: boolean;
	readonly event_date: string; // "2025-04-15T07:24:00Z"
	readonly event_id: UUID;
	readonly id: UUID;
	readonly location_id: UUID;
	readonly location_name: string;
	readonly player_id: UUID;
	readonly player_name: string;
}

export const readMasterAppsList = (abortController?: AbortController) =>
	ajax<ReadonlyArray<IMasterApp>>(`/api/apps/master`, null, abortController);
export const readMasterAppsListByEvent = (eventId: UUID) =>
	ajax<ReadonlyArray<IMasterApp>>(`/api/apps/master/by_event/${eventId}`);
export const readMasterAppsListCompanyClosest = (companyId: UUID) =>
	ajax<ReadonlyArray<IMasterApp>>(
		`/api/apps/master/company_closest/${companyId}`,
	);
export const readMasterApp = (appId: UUID) =>
	ajax<IMasterApp | null>(`/api/apps/master/${appId}`);

export const approveApplication = (appId: UUID) => {
	return ajax<null>(
		`/api/apps/approve/${appId}`,
		prepareAjax(undefined, POST),
	);
};
export const rejectApplication = (appId: UUID) => {
	return ajax<null>(`/api/apps/reject/${appId}`, prepareAjax(undefined, POST));
};

export const enum ETzVariant {
	CITY = "city",
	DEVICE = "device",
	OWN = "own",
}

export interface IApiProfile {
	readonly id: UUID;
	readonly email: string | null;
	readonly email_verified: boolean;
	readonly tg_id: number | null;
	readonly nickname: string;
	readonly about_me: string | null;
	readonly avatar_link: string | null;
	readonly city: string | null;
	readonly region: string | null;
	readonly timezone_offset: number | null;
	readonly tz_variant: ETzVariant | null;
	readonly get_tz_from_device: boolean;
}

export interface IApiShortProfile {
	readonly id: UUID;
	readonly nickname: string;
	readonly about: string | null;
	readonly avatar_link: string | null;
	readonly city: string | null;
	readonly region: string | null;
	readonly verified: boolean;
}

export interface IApiUserPair {
	readonly id: UUID;
	readonly nickname: string;
}

export const getMyProfile: () => Promise<IApiResponse<IApiProfile> | null> =
	async (isSoft = false) => {
		const res = await ajax<IApiProfile>(
			`/api/profile/my`,
			undefined,
			undefined,
			isSoft,
		);

		if (res !== null) {
			enter(res.payload);
		}
		return res;
	};

export const softCheck = () =>
	(
		getMyProfile as unknown as (
			isSoft: boolean,
		) => Promise<IApiResponse<IApiProfile> | null>
	)(true);

export const getAnotherUserProfile = (userId: UUID) => {
	return ajax<IApiShortProfile>(`/api/profile/${userId}`);
};

export interface ITouchesFilter {
	readonly masters: boolean | null | undefined;
	readonly players: boolean | null | undefined;
	readonly coPlayers: boolean | null | undefined;
}

export const getTouchesHistory = (search?: ITouchesFilter | null) => {
	const query = new URLSearchParams({
		masters: Boolean(search?.masters).toString(),
		players: Boolean(search?.players).toString(),
		co_players: Boolean(search?.coPlayers).toString(),
	});
	return ajax<ReadonlyArray<IApiUserPair>>(`/api/touches-history?${query}`);
};

export const updateMyProfile = (
	nickname: string,
	about_me: string | null | undefined,
	city: string | null | undefined,
	own_tz: number | null | undefined,
	tz_variant: ETzVariant | null | undefined,
) => {
	return ajax<null>(
		`/api/profile/my`,
		prepareAjax({ nickname, about_me, city, own_tz, tz_variant }, PUT),
	);
};

export const setAvatar = (url: string) =>
	ajax<null>(`/api/profile/avatar`, prepareAjax({ url }, PUT));

export const getTgAvatar = (link: string) => {
	const query = new URLSearchParams({ link });
	return fetch(`${API_HOST}/api/tg-avatar?${query}`);
};

export interface IApiRegion {
	readonly name: string;
	readonly timezone: string;
}

export const readRegionsList = () => {
	return ajax<ReadonlyArray<IApiRegion>>(`/api/regions`);
};

export interface IApiCity {
	readonly name: string;
	readonly region: string;
	readonly own_timezone: string | null;
}

export const readCitiesList = (region?: string | null) => {
	const query = new URLSearchParams();

	if (region) {
		query.set("region", region);
	}

	return ajax<ReadonlyArray<IApiCity>>(`/api/cities?${query}`);
};

export const addRegion = (name: string, timezone: string) => {
	return ajax<null>(`/api/regions`, prepareAjax({ name, timezone }, POST));
};

export const addCity = (
	name: string,
	region: string,
	own_timezone?: string | null,
) => {
	return ajax<null>(
		`/api/cities`,
		prepareAjax({ name, region, own_timezone }, POST),
	);
};
