export const PROFILE_TABS = [
	{ id: "user", label: "Профиль" },
	{ id: "events", label: "Заявки" },
	{ id: "complist", label: "Кампания" },
	{ id: "resetpass", label: "Сброс пароля" },
] as const;

export const PROFILE_TEXTS = {
	switchLabels: {
		player: "Заявки на мои игры",
		master: "Мои заявки",
	},
	emptyStates: {
		player: {
			title: "Моих заявок нет",
			description: "Вы еще не подавали заявки как мастер",
		},
		master: {
			title: "Заявок на подтверждение нет",
			description: "Как только появятся, вы увидите их здесь",
		},
		companies: {
			title: "Кампаний не создано",
			description: "",
		},
	},
};

export const getGridColumnsConfig = (isChecked: boolean) => ({
	base: isChecked ? 2 : 1,
	sm: isChecked ? 2 : 1,
	md: isChecked ? 3 : 1,
	lg: isChecked ? 4 : 1,
	xl: isChecked ? 4 : 1,
});
