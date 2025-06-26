import { UUID } from "node:crypto";

import { atom, computed } from "nanostores";

import {
	IMasterApp,
	IPlayerApp,
	readMasterAppsList,
	readMasterAppsListByEvent,
	readMasterAppsListCompanyClosest,
	readPlayerAppByEvent,
	readPlayerAppCompanyClosest,
	readPlayerAppsList,
} from "../api";

type EventSource =
	| { type: "company"; companyId: UUID; youAreMaster: boolean }
	| { type: "event"; eventId: UUID; youAreMaster: boolean }
	| { type: "profile"; youAreMaster: boolean };

interface EventsState {
	list: Array<IPlayerApp | IMasterApp>;
	title: string;
	isLoading: boolean;
	isMaster: boolean;
}

const $events = atom<Omit<EventsState, "isMaster">>({
	list: [],
	title: "",
	isLoading: false,
});

const $isMaster = atom(false);

export const $eventsStore = computed(
	[$events, $isMaster],
	(events, isMaster) => ({
		...events,
		isMaster,
	}),
);

const setEventsLoading = (isLoading: boolean) => {
	$events.set({ ...$events.get(), isLoading });
};

const setEventsData = (data: {
	list: Array<IPlayerApp | IMasterApp>;
	title: string;
}) => {
	$events.set({
		...$events.get(),
		list: data.list,
		title: data.title,
		isLoading: false,
	});
};

const setIsMaster = (value: boolean) => {
	$isMaster.set(value);
};

const getApiCall = (source: EventSource) => {
	if (source.youAreMaster) {
		switch (source.type) {
			case "company":
				return () => readMasterAppsListCompanyClosest(source.companyId);
			case "event":
				return () => readMasterAppsListByEvent(source.eventId);
			case "profile":
				return readMasterAppsList;
		}
	} else {
		switch (source.type) {
			case "company":
				return () => readPlayerAppCompanyClosest(source.companyId);
			case "event":
				return () => readPlayerAppByEvent(source.eventId);
			case "profile":
				return readPlayerAppsList;
		}
	}
};

export const fetchEvents = async (source: EventSource) => {
	try {
		setEventsLoading(true);
		setIsMaster(source.youAreMaster);
		setEventsData({ list: [], title: "" });

		const apiCall = getApiCall(source);
		const response = await apiCall();

		if (response?.payload) {
			const payloadArray = Array.isArray(response.payload)
				? response.payload
				: [response.payload];
			setEventsData({
				list: payloadArray,
				title: response.result || "",
			});
			setEventsLoading(false);
		}
	} catch (error) {
		console.error("Error", error);
		setEventsLoading(false);
	}
};
