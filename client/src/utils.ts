import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";

import { useStore } from "@nanostores/preact";

import { $profile, TStorePrifile } from "./store/profile";

export const navBack = () => history.back();

/**
 * Универсальный хук для проверки состояния и редиректа
 */
const useAuthCheck = (
	checkFn: (profile: TStorePrifile | null) => boolean,
	redirectPath: string,
) => {
	const profile = useStore($profile);
	const [isLoading, setIsLoading] = useState(true);
	const [shouldRedirect, setShouldRedirect] = useState(false);

	useEffect(() => {
		const unsubscribe = $profile.listen((p) => {
			setIsLoading(false);
			if (!checkFn(p ?? null)) {
				setShouldRedirect(true);
			}
		});

		return unsubscribe;
	}, [checkFn]);

	useEffect(() => {
		if (shouldRedirect && window.location.pathname !== redirectPath) {
			route(redirectPath, true);
			setShouldRedirect(false);
		}
	}, [shouldRedirect, redirectPath]);

	useEffect(() => {
		if (!isLoading && profile && !checkFn(profile)) {
			setShouldRedirect(true);
		}
	}, [profile, isLoading, checkFn]);

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
 * Хук для проверки верификации пользователя (email или telegram)
 */
export const useVerificationGuard = () => {
	const { isAllowed } = useAuthCheck((profile) => {
		return (
			(!!profile?.email && !!profile?.email_verified) || !!profile?.tg_id
		);
	}, "/");

	return { isVerified: isAllowed };
};

/**
 * Комбинированный хук для защиты страниц
 */
export const useAuthVerification = () => {
	const { isAuthenticated, isLoading } = useAuthGuard();
	const { isVerified } = useVerificationGuard();
	const [shouldRedirect, setShouldRedirect] = useState(false);

	useEffect(() => {
		if (!isLoading && !isAuthenticated && window.location.pathname !== "/") {
			setShouldRedirect(true);
		}
	}, [isAuthenticated, isLoading]);

	useEffect(() => {
		if (shouldRedirect) {
			route("/", true);
			setShouldRedirect(false);
		}
	}, [shouldRedirect]);

	return {
		isAuthenticated,
		isVerified: isAuthenticated ? isVerified : null,
		isLoading,
		reset: () => window.location.reload(),
	};
};
