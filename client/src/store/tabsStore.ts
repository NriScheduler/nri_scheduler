import { atom } from "nanostores";

const MASTERY_KEY = "nri_lastActiveTab";
const DEFAULT = "user";

const getSavedTab = () => {
	if (typeof window === "undefined") {
		return DEFAULT;
	}
	return localStorage.getItem(MASTERY_KEY) || DEFAULT;
};

export const $activeTab = atom<string>(getSavedTab());

// Функция для сохранения активной вкладки
export const setActiveTab = (tabName: string) => {
	$activeTab.set(tabName);
	localStorage.setItem(MASTERY_KEY, tabName);
};
