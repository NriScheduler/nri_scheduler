import { map } from "nanostores";

import { IEventsFilter } from "../api";

export interface IFilterState extends IEventsFilter {
	showOwnGames: boolean;
	showOtherMasters: boolean;
	imamaster: boolean | null;
}

export const initialFilterState: IFilterState = {
	location: null,
	region: null,
	city: null,
	master: null,
	showOwnGames: false,
	showOtherMasters: false,
	company: null,
	applied: null,
	not_rejected: null,
	imamaster: null,
};

// Хранилище фильтров
export const filterStore = map<IFilterState>({ ...initialFilterState });

// Сброс к начальному состоянию
export const resetFilters = () => {
	filterStore.set({ ...initialFilterState });
};

// Получение изменённых полей
export const getChangedFilters = (): Partial<IEventsFilter> => {
	const current = filterStore.get();
	const changed: Partial<IEventsFilter> = {};

	if (current.location !== initialFilterState.location) {
		changed.location = current.location;
	}

	if (current.region !== initialFilterState.region) {
		changed.region = current.region;
	}

	if (current.city !== initialFilterState.city) {
		changed.city = current.city;
	}

	if (current.master !== initialFilterState.master) {
		changed.master = current.master;
	}

	if (current.company !== initialFilterState.company) {
		changed.company = current.company;
	}

	if (current.applied === true) {
		changed.applied = true;
	}

	if (current.not_rejected === true) {
		changed.not_rejected = true;
	}

	// Вычисляем imamaster по правилам
	const { showOwnGames, showOtherMasters } = current;

	if (showOwnGames && !showOtherMasters) {
		changed.imamaster = true;
	} else if (!showOwnGames && showOtherMasters) {
		changed.imamaster = false;
	}
	// else if (!showOwnGames && !showOtherMasters){}

	return changed;
};
