import { UUID } from "node:crypto";

import { atom, computed } from "nanostores";

import {
	IMasterApp,
	IPlayerApp,
	readMasterAppsListCompanyClosest,
	readPlayerAppCompanyClosest,
} from "../api";

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

export const fetchEvents = async (event: {
	you_are_master: boolean;
	company_id: UUID;
}) => {
	try {
		setEventsLoading(true);
		setIsMaster(event.you_are_master);

		const response = event.you_are_master
			? await readMasterAppsListCompanyClosest(event.company_id)
			: await readPlayerAppCompanyClosest(event.company_id);

		if (response?.payload) {
			const payloadArray = Array.isArray(response.payload)
				? response.payload
				: [response.payload];
			setEventsData({
				list: payloadArray,
				title: response.result || "",
			});
		}
	} catch (error) {
		console.error("Error", error);
		setEventsLoading(false);
	}
};
