import { atom, ReadableAtom, WritableAtom } from "nanostores";

import { disableMastery } from "./mastery";
import { resetOffset, setOffset } from "./tz";
import { IApiSelfInfo } from "../api";

export const $signed: ReadableAtom<boolean> = atom(false);

export const enter = ({ timezone_offset }: IApiSelfInfo) => {
	($signed as WritableAtom<boolean>).set(true);

	if (typeof timezone_offset === "number") {
		setOffset(timezone_offset);
	}
};

export const leave = () => {
	($signed as WritableAtom<boolean>).set(false);
	disableMastery();
	resetOffset();
};
