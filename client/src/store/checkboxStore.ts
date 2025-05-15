import { atom } from "nanostores";

type CheckboxState = Record<string, boolean>;

const persistentAtom = (key: string, initialValue: CheckboxState) => {
	const getSavedValue = (): CheckboxState => {
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

	const store = atom<CheckboxState>(getSavedValue());

	store.listen((value) => {
		localStorage.setItem(key, JSON.stringify(value));
	});

	return store;
};

const CHECKBOX_KEY = "nri_checkboxState";

export const $checkboxState = persistentAtom(CHECKBOX_KEY, {
	eventsView: true,
	companyView: true,
});

export const toggleCheckbox = (checkboxId: string) =>
	$checkboxState.set({
		...$checkboxState.get(),
		[checkboxId]: !$checkboxState.get()[checkboxId],
	});
