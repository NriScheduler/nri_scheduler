import { map } from "nanostores";

type CheckboxState = Record<string, boolean>;

const persistentMap = (key: string, initialValue: CheckboxState) => {
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

	const store = map<CheckboxState>(getSavedValue());

	store.listen((value) => {
		localStorage.setItem(key, JSON.stringify(value));
	});

	return store;
};

const CHECKBOX_KEY = "nri_checkboxState";

export const $checkboxState = persistentMap(CHECKBOX_KEY, {
	eventsView: true,
	eventsType: true,
	companyView: true,
});

export const toggleCheckbox = (checkboxId: string) => {
	$checkboxState.setKey(checkboxId, !$checkboxState.get()[checkboxId]);
};
