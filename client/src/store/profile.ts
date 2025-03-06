import { atom, ReadableAtom, WritableAtom } from "nanostores";
import { disableMastery } from "./mastery";
import { resetOffset, setOffset } from "./tz";
import { getUserProfile, IApiSelfInfo, IApiUserInfo, softCheck } from "../api";

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

export const userStore = atom<IApiUserInfo | null>(null);

export const DEFAULT_PROFILE_IMAGE = "https://i.pinimg.com/736x/89/2a/2a/892a2a5f035f9e4a05e7861003f762a0.jpg";

export const fetchUserData = () => {
	softCheck()
		.then((isLoggedIn) => {
			if (isLoggedIn) {
				getUserProfile().then((res) => {
					if (res) {
						userStore.set(res.payload);
					}
				});
			}
		})
		.catch((error) => {
			console.log("Ошибка при загрузке данных пользователя:", error);
			userStore.set(null);
		});
};
