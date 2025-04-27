import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";

import { useStore } from "@nanostores/preact";

import { $profile } from "./store/profile";

export const navBack = () => history.back();

/**
 * Универсальный хук для проверки состояния и редиректа
 */
const useAuthCheck = (
	checkFn: (profile: any) => boolean,
	redirectPath: string,
) => {
	const profile = useStore($profile);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const unsubscribe = $profile.listen((p) => {
			if (p !== undefined) {
				setIsLoading(false);
				if (!checkFn(p)) {
					window.history.replaceState(null, "", redirectPath);
				}
			}
		});

		return unsubscribe;
	}, [checkFn, redirectPath]);

	useEffect(() => {
		if (!isLoading && profile && !checkFn(profile)) {
			route(redirectPath, true);
			window.history.replaceState(null, "", redirectPath);
		}
	}, [profile, isLoading, checkFn, redirectPath]);

	return {
		isAllowed: profile ? checkFn(profile) : false,
		isLoading,
	};
};

/**
 * Хук для проверки авторизации
 */
export const useAuthGuard = () => {
	const { isAllowed, isLoading } = useAuthCheck(
		(profile) => !!profile?.signed,
		"/signin",
	);

	return { isAuthenticated: isAllowed, isLoading };
};

/**
 * Хук для проверки подтверждения email
 */
export const useEmailVerifyGuard = () => {
	const { isAllowed } = useAuthCheck(
		(profile) => !!profile?.email_verified,
		"/",
	);

	return { isVerified: isAllowed };
};

/**
 * Комбинированный хук для защиты страниц
 */
export const useAuthVerification = () => {
	const { isAuthenticated, isLoading } = useAuthGuard();
	const { isVerified } = useEmailVerifyGuard();

	return {
		isAuthenticated,
		isVerified: isAuthenticated ? isVerified : true,
		isLoading,
	};
};
