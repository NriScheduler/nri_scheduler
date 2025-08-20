import { computed, map } from "nanostores";

import { type IApiLocation, readLocations } from "../api";

type LocationsStore = {
	loading: boolean;
	data: readonly IApiLocation[] | null;
};

// Инициализация хранилища
const _locations = map<LocationsStore>({
	loading: false,
	data: null,
});

// Computed store с локациями (с автозагрузкой)
export const $locations = computed(_locations, (store) => {
	// Автозагрузка если данных нет и не идет загрузка
	if (!store.loading && store.data === null) {
		_locations.setKey("loading", true);
		readLocations().then((response) => {
			_locations.set({
				loading: false,
				data: response?.payload ?? null,
			});
		});
	}
	return store.data ?? [];
});

// Функция для ручной загрузки
export const loadLocations = () => {
	_locations.setKey("loading", true);
	readLocations().then((response) => {
		_locations.set({
			loading: false,
			data: response?.payload ?? null,
		});
	});
};

// Получение состояния загрузки
export const $locationsLoading = computed(_locations, (store) => store.loading);
