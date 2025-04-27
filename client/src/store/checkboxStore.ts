import { atom } from "nanostores";

const persistentAtom = <T>(key: string, initialValue: T) => {
	const getSavedValue = (): T => {
		if (typeof window === "undefined") {
			return initialValue;
		}

		try {
			const saved = localStorage.getItem(key);
			return saved ? JSON.parse(saved) : initialValue;
		} catch {
			return initialValue;
		}
	};

	const store = atom<T>(getSavedValue());

	store.listen((value) => {
		localStorage.setItem(key, JSON.stringify(value));
	});

	return store;
};

const CHECKBOX_KEY = "nri_checkboxState";
const TRUE = true;

export const $checkboxState = persistentAtom<boolean>(CHECKBOX_KEY, TRUE);

export const toggleCheckbox = () => $checkboxState.set(!$checkboxState.get());
