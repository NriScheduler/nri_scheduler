import { atom, computed } from "nanostores";

const MASTERY_KEY = "nri_mastery";
const TRUE = "true";

const _mastery = atom(localStorage.getItem(MASTERY_KEY) === TRUE);
export const $mastery = computed(_mastery, (m) => m);

export const enableMastery = () => {
	localStorage.setItem(MASTERY_KEY, TRUE);
	_mastery.set(true);
};

export const disableMastery = () => {
	localStorage.removeItem(MASTERY_KEY);
	_mastery.set(false);
};
