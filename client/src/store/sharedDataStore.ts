import { atom } from "nanostores";

import {
	IApiCompany,
	IApiLocation,
	IMasterApp,
	readLocations,
	readMasterAppsList,
	readMyCompanies,
} from "../api";

export const sharedCompanies = atom<ReadonlyArray<IApiCompany>>([]);
export const sharedLocations = atom<ReadonlyArray<IApiLocation>>([]);
export const sharedMasters = atom<ReadonlyArray<IMasterApp>>([]);
export const sharedDataLoading = atom(false);

export const loadCompanies = async () => {
	try {
		const response = await readMyCompanies();
		return response?.payload || [];
	} catch (error) {
		console.error("Failed to load companies:", error);
		return [];
	}
};

export const loadLocations = async () => {
	try {
		const response = await readLocations();
		return response?.payload || [];
	} catch (error) {
		console.error("Failed to load locations:", error);
		return [];
	}
};

export const loadMasters = async () => {
	try {
		const response = await readMasterAppsList();
		return response?.payload || [];
	} catch (error) {
		console.error("Failed to load masters:", error);
		return [];
	}
};

export const loadAllData = async () => {
	try {
		const [companies, locations, masters] = await Promise.all([
			loadCompanies(),
			loadLocations(),
			loadMasters(),
		]);
		return { companies, locations, masters };
	} catch (error) {
		console.error("Failed to load all data:", error);
		return { companies: [], locations: [], masters: [] };
	}
};

export const loadSharedData = async () => {
	sharedDataLoading.set(true);
	try {
		const { companies, locations, masters } = await loadAllData();
		sharedCompanies.set(companies);
		sharedLocations.set(locations);
		sharedMasters.set(masters);
	} finally {
		sharedDataLoading.set(false);
	}
};
