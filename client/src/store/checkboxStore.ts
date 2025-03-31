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

export const $checkboxState = persistentAtom<boolean>("checkboxState", false);

export const toggleCheckbox = () => $checkboxState.set(!$checkboxState.get());
