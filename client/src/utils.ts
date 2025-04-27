export const navBack = () => history.back();

export const calcMapIconLink = (mapLink: string | null | undefined): string => {
	if (!mapLink) {
		return "";
	} else if (mapLink.startsWith("https://2gis.ru/")) {
		return "/assets/2gis.svg";
	} else if (mapLink.startsWith("https://yandex.ru/maps/")) {
		return "/assets/ym.svg";
	} else if (
		mapLink.startsWith("https://google.ru/maps/") ||
		mapLink.startsWith("https://www/google.ru/maps/") ||
		mapLink.startsWith("https://google.com/maps/") ||
		mapLink.startsWith("https://www.google.com/maps/")
	) {
		return "/assets/gm.svg";
	} else {
		return "";
	}
};
