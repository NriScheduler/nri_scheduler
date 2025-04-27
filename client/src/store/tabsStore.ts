import { atom } from "nanostores";

const LAST_ACTIVE_KEY = "nri_lastActiveTab";
const DEFAULT = "user";

const getSavedTab = () => {
	if (typeof window === "undefined") {
		return DEFAULT;
	}
	return localStorage.getItem(LAST_ACTIVE_KEY) || DEFAULT;
};

export const $activeTab = atom<string>(getSavedTab());

// Функция для сохранения активной вкладки
export const setActiveTab = (tabName: string) => {
	$activeTab.set(tabName);
	localStorage.setItem(LAST_ACTIVE_KEY, tabName);
};
