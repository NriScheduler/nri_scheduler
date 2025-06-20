import { UUID } from "node:crypto";

import { computed, map } from "nanostores";

import {
	applyEvent,
	cancelEvent,
	EScenarioStatus,
	type IApiEvent,
	readEvent,
	reopenEvent,
	updateEvent,
} from "../api";
import { toaster } from "../components/ui/toaster";

type EventStore = {
	loading: boolean;
	updating: boolean;
	data: IApiEvent | null;
	subscribing: boolean;
	applied: boolean;
};

export const $event = map<EventStore>({
	loading: false,
	updating: false,
	data: null,
	subscribing: false,
	applied: false,
});

export const $isEventMaster = computed($event, (store) => {
	return store.data?.you_are_master ?? false;
});

export const fetchEvent = async (eventId: UUID) => {
	$event.setKey("loading", true);
	try {
		const res = await readEvent(eventId);
		if (res !== null) {
			$event.set({
				...$event.get(),
				loading: false,
				data: res.payload,
				applied: res.payload.you_applied ?? false,
			});
		} else {
			$event.set({
				loading: false,
				updating: false,
				data: null,
				subscribing: false,
				applied: false,
			});
		}
	} catch (e) {
		console.error("Failed to fetch event", e);
		$event.setKey("loading", false);
	}
};

export const updateEventAction = async (
	eventId: UUID,
	date: string,
	locationId: UUID,
	maxSlots: number | null,
	planDuration: number | null,
) => {
	$event.setKey("updating", false);
	try {
		const response = await updateEvent(
			eventId,
			date,
			locationId,
			maxSlots,
			planDuration,
		);

		if (response?.status === EScenarioStatus.SCENARIO_SUCCESS) {
			toaster.success({ title: "Событие успешно обновлено" });
			await fetchEvent(eventId);
			return true;
		}
		return false;
	} catch (error) {
		console.error(error);
		toaster.error({ title: "Ошибка при обновлении события" });
		return false;
	} finally {
		$event.setKey("updating", false);
	}
};

export const cancelEventAction = async (eventId: UUID) => {
	await cancelEvent(eventId);
	toaster.success({ title: "Событие отменено" });
	await fetchEvent(eventId);
};

export const reopenEventAction = async (eventId: UUID) => {
	await reopenEvent(eventId);
	toaster.success({ title: "Событие открыто" });
	await fetchEvent(eventId);
};

export const applyToEvent = async (eventId: UUID) => {
	$event.setKey("subscribing", true);
	try {
		const response = await applyEvent(eventId);
		if (response?.status === EScenarioStatus.SCENARIO_SUCCESS) {
			toaster.success({ title: "Успех. Запись оформлена" });
			$event.setKey("applied", true);
		}
	} finally {
		$event.setKey("subscribing", false);
	}
};
