import { h } from "preact";
import { useState } from "preact/hooks";
import { route as navigate } from "preact-router";
import { useForm } from "react-hook-form";
import { FaTelegramPlane as TelegramIcon } from "react-icons/fa";
import { MdOutlineAlternateEmail as EmailIcon } from "react-icons/md";

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
import { getMyProfile, registration, signInTg, TG_BOT_ID } from "../../../api";
import { ITelegramUser } from "../../../typings/telegram";

interface IFormValues {
	readonly name: string;
	readonly email: string;
	readonly password: string;
	readonly repassword: string;
}

export const SingUpPage = () => {
	const {
		register,
		handleSubmit,
		getValues,
		reset,
		formState: { errors },
	} = useForm<IFormValues>();

	const [fetching, setFetching] = useState(false);

	const onSubmit = handleSubmit(({ name, email, password }) => {
		setFetching(true);

		registration(name, email, password).then((res) => {
			if (res !== null) {
				toaster.success({
					title: "Вам отправлено письмо для подтверждения email",
				});
				navigate("/signin", true);
			} else {
				setFetching(false);
			}
		});
	});

	const submitTg = (user: ITelegramUser | boolean): void => {
		console.log("user:");
		console.log(user);
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
					<Heading>Регистрация</Heading>
					<Field
						label="Логин"
						invalid={Boolean(errors.name)}
						errorText={errors.name?.message}
					>
						<Input
							placeholder="login"
							{...register("name", {
								required: "Заполните поле",
							})}
						/>
					</Field>
					<Field
						label="Электронная почта"
						invalid={Boolean(errors.email)}
						errorText={errors.email?.message}
					>
						<Input
							placeholder="me@example.ru"
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
							autocomplete="off"
							{...register("password", {
								required: "Заполните поле",
							})}
						/>
					</Field>
					<Field
						label="Повторите пароль"
						invalid={Boolean(errors.repassword)}
						errorText={errors.repassword?.message}
					>
						<PasswordInput
							placeholder="******"
							autocomplete="off"
							{...register("repassword", {
								required: "Заполните поле",
								validate: (value) =>
									getValues("password") === value ||
									"Пароли не совпадают",
							})}
						/>
					</Field>
					<Button type="submit" disabled={fetching} w="full">
						<EmailIcon />
						Зарегистрироваться
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
						<TelegramIcon /> Зарегистрироваться при помощи Telegram
					</Button>
					<Text mx="auto" fontSize="sm">
						Уже зарегистрированы?{" "}
						<Link variant="underline" href="/signin" colorPalette="teal">
							Авторизация
						</Link>
					</Text>
				</Stack>
			</form>
		</Container>
	);
};

export default SingUpPage;
