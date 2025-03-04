import { atom, ReadableAtom, WritableAtom } from "nanostores";

const MASTERY_KEY = "nri_mastery";
const TRUE = "true";

export const $mastery: ReadableAtom<boolean> = atom(
	localStorage.getItem(MASTERY_KEY) === TRUE,
);

export const enableMastery = () => {
	localStorage.setItem(MASTERY_KEY, TRUE);
	($mastery as WritableAtom<boolean>).set(true);
};

export const disableMastery = () => {
	localStorage.removeItem(MASTERY_KEY);
	($mastery as WritableAtom<boolean>).set(false);
};
