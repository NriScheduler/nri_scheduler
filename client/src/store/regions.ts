import { computed, map } from "nanostores";

import { type IApiRegion, readRegionsList } from "../api";

type RegionsStore = {
	loading: boolean;
	data: readonly IApiRegion[] | null;
};

// Инициализация хранилища
const _regions = map<RegionsStore>({
	loading: false,
	data: null,
});

// Computed store с регионами
export const $regions = computed(_regions, (store) => {
	// Автозагрузка если данных нет и не идет загрузка
	if (!store.loading && store.data === null) {
		_regions.setKey("loading", true);
		readRegionsList().then((response) => {
			_regions.set({
				loading: false,
				data: response?.payload ?? null,
			});
		});
	}
	return store.data ?? [];
});

// Функция для ручной загрузки
export const loadRegions = () => {
	_regions.setKey("loading", true);
	readRegionsList().then((response) => {
		_regions.set({
			loading: false,
			data: response?.payload ?? null,
		});
	});
};

// Фильтрация регионов по timezone
export const $regionsByTimezone = (timezone: string) =>
	computed(_regions, (store) => {
		return store.data?.filter((region) => region.timezone === timezone) ?? [];
	});

// Получение состояния загрузки
export const $regionsLoading = computed(_regions, (store) => store.loading);
