import { atom, ReadableAtom, WritableAtom } from "nanostores";

import { resetOffset, setOffset } from "./tz";
import { IApiProfile } from "../api";

export const $signed: ReadableAtom<boolean> = atom(false);

export const enter = ({ timezone_offset, get_tz_from_device }: IApiProfile) => {
	($signed as WritableAtom<boolean>).set(true);
	setOffset(timezone_offset, get_tz_from_device);
};

export const leave = () => {
	($signed as WritableAtom<boolean>).set(false);
	resetOffset();
};
