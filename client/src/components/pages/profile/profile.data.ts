export const PROFILE_TABS = [
	{ id: "user", label: "Профиль" },
	{ id: "events", label: "Заявки" },
	{ id: "complist", label: "Кампания" },
	{ id: "resetpass", label: "Сброс пароля" },
] as const;

export const PROFILE_TEXTS = {
	switchLabels: {
		player: "Заявки на игры",
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
