export interface ITelegramUser {
	readonly auth_date: number;
	readonly first_name?: string | null;
	readonly hash: string;
	readonly id: number;
	readonly last_name?: string | null;
	readonly photo_url?: string | null;
	readonly username?: string | null;
}

declare global {
	interface Window {
		readonly Telegram: {
			readonly Login: {
				readonly auth: (
					options: { bot_id: string; request_access?: boolean },
					callback: (user: ITelegramUser | boolean) => void,
				) => void;
			};
		};
	}
}
