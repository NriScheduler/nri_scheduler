import { atom } from "nanostores";

const getSavedTab = () => {
	if (typeof window === "undefined") {
		return "user";
	}
	return localStorage.getItem("lastActiveTab") || "user";
};

export const $activeTab = atom<string>(getSavedTab());

// Функция для сохранения активной вкладки
export const setActiveTab = (tabName: string) => {
	$activeTab.set(tabName);
	localStorage.setItem("lastActiveTab", tabName);
};
