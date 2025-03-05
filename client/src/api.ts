import type { UUID } from "node:crypto";

import { route as navigate } from "preact-router";
import { toast } from "react-hot-toast";

import { startFetching, stopFetching } from "./store/fetching";
import { enter, leave } from "./store/profile";

const API_HOST = import.meta.env.PROD
	? ""
	: (import.meta.env.CLIENT_API_HOST as string | undefined) || "";
const CREDENTIALS = import.meta.env.PROD ? undefined : "include";

const POST = "POST";
const PUT = "PUT";
const URL_ENCODED = true;

export const enum EScenarioStatus {
	SCENARIO_SUCCESS,
	UNAUTHORIZED,
	SCENARIO_FAIL,
	SYSTEM_ERROR,
	SESSION_EXPIRED,
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
	init?: IRequestInit,
	isSoft = false,
): Promise<IApiResponse<T> | null> => {
	let controller: AbortController | undefined;
	let timeoutId: ReturnType<typeof setTimeout>;

	if (init?.timeoutMilliseconds) {
		controller = new AbortController();
		timeoutId = setTimeout(
			() => controller!.abort(),
			init.timeoutMilliseconds,
		);
	}

	startFetching();

	return fetch(API_HOST + input, {
		body: init?.body,
		cache: "no-store",
		credentials: CREDENTIALS,
		headers: init?.headers,
		method: init?.method,
		signal: controller?.signal,
	})
		.then((res) => checkResponse<T>(res, isSoft))
		.finally(() => {
			clearTimeout(timeoutId);
			stopFetching();
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

		toast.error("Ошибка обращения к серверу");
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
					toast.error(apiRes.result);
					navigate("/signin");
				}

				break;

			case EScenarioStatus.SCENARIO_FAIL:
			case EScenarioStatus.SYSTEM_ERROR:
				toast.error(apiRes.result);
				break;

			default:
				toast.error("Неизвестный статус ответа");
				console.info("Неизвестный статус");
				console.error(apiRes);
				break;
		}

		return null;
	} catch (err) {
		if (err instanceof Error && err.name === "AbortError") {
			toast.error("Истекло время ожидания ответа сервера");
		} else {
			toast.error("Неизвестная ошибка");
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

export const logout = () =>
	ajax<null>("/api/logout", prepareAjax(undefined, POST)).then((res) => {
		if (res?.status === EScenarioStatus.SCENARIO_SUCCESS) {
			leave();
		}

		return res;
	});

export interface IApiLocation {
	readonly id: UUID;
	readonly name: string;
	readonly address: string | null;
	readonly description: string | null;
}

export const readLocations = (nameFilter?: string | null) => {
	const query = new URLSearchParams();
	if (nameFilter) {
		query.append("name", nameFilter);
	}

	return ajax<IApiLocation[]>(`/api/locations?${query}`);
};

export const readLocationById = (locId: UUID) =>
	ajax<IApiLocation>(`/api/locations/${locId}`);

export const addLocation = (
	name: string,
	address?: string | null,
	description?: string | null,
) =>
	ajax<UUID>(
		"/api/locations",
		prepareAjax({ name, address, description }, POST),
	);

export interface IApiCompany {
	readonly id: UUID;
	readonly master: UUID;
	readonly name: string;
	readonly system: string;
	readonly description: string | null;
}

export interface IApiCompanyInfo {
	readonly id: UUID;
	readonly master: UUID;
	readonly name: string;
	readonly name_name: string;
	readonly system: string;
	readonly description: string | null;
	readonly you_are_master: boolean;
}

export const readMyCompanies = (nameFilter?: string | null) => {
	const query = new URLSearchParams();
	if (nameFilter) {
		query.append("name", nameFilter);
	}

	return ajax<IApiCompany[]>(`/api/companies/my?${query}`);
};

export const readCompanyById = (companyId: UUID) =>
	ajax<IApiCompanyInfo>(`/api/companies/${companyId}`);

export const addCompany = (
	name: string,
	system: string,
	description?: string | null,
) =>
	ajax<UUID>(
		"/api/companies",
		prepareAjax({ name, system, description }, POST),
	);

export const updateCompany = (
	companyId: UUID,
	name: string,
	system: string,
	description?: string | null,
) => {
	return ajax<null>(
		`/api/companies/${companyId}`,
		prepareAjax({ name, system, description }, PUT),
	);
};

export interface IApiEvent {
	readonly id: UUID;
	readonly company: string;
	readonly company_id: UUID;
	readonly master: string;
	readonly master_id: UUID;
	readonly location: string;
	readonly location_id: UUID;
	readonly date: string;
	readonly max_slots: number | null;
	readonly plan_duration: number | null;
	readonly players: string[];
	readonly you_applied: boolean;
	readonly you_are_master: boolean;
	readonly your_approval: boolean | null;
}

export interface IEventsFilter {
	master?: UUID | null;
	location?: UUID | null;
	applied?: boolean | null;
	not_rejected?: boolean | null;
	imamaster?: boolean | null;
}

export const readEventsList = (
	date_from: string,
	date_to: string,
	filters?: IEventsFilter | null,
) => {
	const query: Record<string, string> = { date_from, date_to };

	if (filters) {
		Object.entries(filters).forEach(([key, val]) => {
			if (val !== null && val !== undefined) {
				query[key] = val;
			}
		});
	}

	return ajax<IApiEvent[]>(`/api/events?${new URLSearchParams(query)}`);
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

export interface IApiSelfInfo {
	readonly id: UUID;
	readonly timezone_offset: number | null;
}

export const check = async (isSoft = false): Promise<boolean> => {
	const res = await ajax<IApiSelfInfo>("/api/check", undefined, isSoft);

	if (res !== null) {
		enter(res.payload);
	}
	return res !== null;
};

export const softCheck = (): Promise<boolean> => {
	const SOFT_CHECK = true;
	return check(SOFT_CHECK);
};

export interface IApiUserInfo {
	readonly email: string | null;
	readonly nickname: string;
	readonly phone: string | null;
}

export const getUserProfile = () => {
	return ajax<IApiUserInfo>(`/api/profile`);
};
