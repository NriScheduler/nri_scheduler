import { h } from "preact";
import { useState } from "preact/hooks";
import { route as navigate } from "preact-router";
import { useForm } from "react-hook-form";

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
import { registration } from "../../../api";

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
		formState: { errors },
	} = useForm<IFormValues>();

	const [fetching, setFetching] = useState(false);

	const onSubmit = handleSubmit(({ name, email, password }) => {
		setFetching(true);

		registration(name, email, password).then((res) => {
			if (res !== null) {
				navigate("/signin", true);
			} else {
				setFetching(false);
			}
		});
	});

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
							{...register("repassword", {
								required: "Заполните поле",
								validate: (value) =>
									getValues("password") === value ||
									"Пароли не совпадают",
							})}
						/>
					</Field>
					<Button type="submit" disabled={fetching} w="full">
						Зарегистрироваться
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
