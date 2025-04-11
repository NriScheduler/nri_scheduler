import { h } from "preact";
import { useState } from "preact/hooks";
import { route as navigate } from "preact-router";
import { useForm } from "react-hook-form";
import { FaTelegramPlane } from "react-icons/fa";

import {
	Button,
	Container,
	Heading,
	Input,
	Link,
	Stack,
	Text,
} from "@chakra-ui/react";

import { Field } from "../../ui/field";
import { PasswordInput } from "../../ui/password-input";
import { toaster } from "../../ui/toaster";
import { getMyProfile, signIn, signInTg, TG_BOT_ID } from "../../../api";
import { ITelegramUser } from "../../../typings/telegram";

interface IFormSignin {
	readonly email: string;
	readonly password: string;
}

export const SignInPage = () => {
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<IFormSignin>();

	const [fetching, setFetching] = useState(false);

	const onSubmit = handleSubmit(({ email, password }) => {
		setFetching(true);

		signIn(email, password)
			.then((res) => {
				return res === null ? null : getMyProfile();
			})
			.then((res) => {
				if (res !== null) {
					reset();
					toaster.success({ title: "Успешная авторизация" });
					navigate("/calendar");
				} else {
					setFetching(false);
				}
			});
	});

	const submitTg = (user: ITelegramUser | boolean): void => {
		if (!user || typeof user !== "object") {
			toaster.error({
				title: "Не удалось установить связь с Telegram",
			});
			return;
		}

		setFetching(true);

		signInTg(user)
			.then((res) => res && getMyProfile())
			.then((res) => {
				if (res !== null) {
					reset();
					toaster.success({ title: "Успешная авторизация" });
					navigate("/calendar");
				} else {
					setFetching(false);
				}
			});
	};

	return (
		<Container>
			<form onSubmit={onSubmit}>
				<Stack gap="4" align="flex-start" maxW="lg" w="full" mx="auto">
					<Heading>Авторизация</Heading>
					<Field
						label="Электронная почта"
						invalid={Boolean(errors.email)}
						errorText={errors.email?.message}
					>
						<Input
							placeholder="me@example.ru"
							autocomplete="email"
							{...register("email", {
								required: "Заполните поле",
								pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
							})}
						/>
					</Field>
					<Field
						label="Пароль"
						invalid={Boolean(errors.password)}
						errorText={errors.password?.message}
					>
						<PasswordInput
							placeholder="******"
							autocomplete="password"
							{...register("password", {
								required: "Заполните поле",
							})}
						/>
					</Field>
					<Button type="submit" disabled={fetching} w="full">
						Войти
					</Button>
					<Button
						type="button"
						backgroundColor="#08c"
						disabled={!TG_BOT_ID || fetching}
						w="full"
						onClick={() => {
							window.Telegram.Login.auth(
								{ bot_id: TG_BOT_ID!, request_access: true },
								submitTg,
							);
						}}
					>
						<FaTelegramPlane /> Войти при помощи Telegram
					</Button>
					<Text mx="auto" fontSize="sm">
						Еще не зарегистрированы?{" "}
						<Link variant="underline" href="/signup" colorPalette="teal">
							Зарегистрироваться
						</Link>
					</Text>
				</Stack>
			</form>
		</Container>
	);
};
