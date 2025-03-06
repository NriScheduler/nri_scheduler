import { atom, ReadableAtom, WritableAtom } from "nanostores";

export const $fetching: ReadableAtom<boolean> = atom(false);

export const startFetching = () => {
	($fetching as WritableAtom<boolean>).set(true);
};

export const stopFetching = () => {
	($fetching as WritableAtom<boolean>).set(false);
};
