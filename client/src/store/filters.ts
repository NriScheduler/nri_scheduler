import { map } from "nanostores";

import { IEventsFilter } from "../api";

// Базовый интерфейс состояния фильтров
export interface IFilterState extends IEventsFilter {
	showOwnGames: boolean;
	showOtherMasters: boolean;
}

// Базовое начальное состояние
const baseInitialState: IFilterState = {
	master: null,
	location: null,
	region: null,
	city: null,
	applied: null,
	not_rejected: null,
	imamaster: null,
	company: null,
	showOwnGames: false,
	showOtherMasters: false,
};

// Начальные состояния для разных типов пользователей
export const initialMasterFilters: IFilterState = {
	...baseInitialState,
	showOwnGames: true,
	showOtherMasters: false,
};

export const initialPlayerFilters: IFilterState = {
	...baseInitialState,
	showOwnGames: false,
	showOtherMasters: true,
};

// Хранилища фильтров
export const $masterFilters = map<IFilterState>(initialMasterFilters);
export const $playerFilters = map<IFilterState>(initialPlayerFilters);

// Сброс фильтров
export const resetFilters = (isMaster: boolean) => {
	const store = isMaster ? $masterFilters : $playerFilters;
	const current = store.get();
	store.set({
		...(isMaster ? initialMasterFilters : initialPlayerFilters),
		applied: current.applied,
		not_rejected: current.not_rejected,
	});
};

// Получение изменённых полей с строгой типизацией
export const getChangedFilters = (
	isMaster: boolean,
): Partial<IEventsFilter> => {
	const store = isMaster ? $masterFilters : $playerFilters;
	const initialState = isMaster ? initialMasterFilters : initialPlayerFilters;

	const current = store.get();
	const changed: Partial<IEventsFilter> = {};

	const eventFilterKeys: Array<keyof IEventsFilter> = [
		"master",
		"location",
		"region",
		"city",
		"applied",
		"not_rejected",
		"imamaster",
		"company",
	];

	eventFilterKeys.forEach((key) => {
		if (current[key] !== initialState[key]) {
			changed[key] = current[key] as never;
		}
	});

	const { showOwnGames, showOtherMasters } = current;
	if (showOwnGames && !showOtherMasters) {
		changed.imamaster = true;
	} else if (!showOwnGames && showOtherMasters) {
		changed.imamaster = false;
	}

	return changed;
};
