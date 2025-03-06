import { h } from "preact";

import { useForm } from "react-hook-form";

import { Button, HStack, Input, Stack, Textarea } from "@chakra-ui/react";
import { Field } from "../../ui/field";
import { ProfilePicture } from "./profile-picture";

interface IFormProfile {
	nickname: string;
	location: string;
	bio?: string;
	avatar?: string;
	email: string;
}

export const ProfileUpdate = ({ user }: any) => {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<IFormProfile>({
		values: {
			nickname: user?.nickname,
			location: "",
			bio: "",
			avatar: user?.avatar,
			email: user?.email,
		},
	});

	const onSubmit = handleSubmit((data) => {
		console.log(data);
	});

	return (
		<form onSubmit={onSubmit}>
			<Stack gap="4" maxW="lg" w="full" alignItems="flex-start">
				<HStack w="full" gap={6}>
					<Stack maxW="140px" w="full">
						<ProfilePicture
							register={register}
							username={user?.nickname}
						/>
					</Stack>
					<Stack w="full">
						<Field label="Имя пользователя" invalid={!!errors.nickname}>
							<Input
								placeholder="Заполните поле"
								{...register("nickname")}
							/>
						</Field>
						<Field label="Электронная почта" invalid={!!errors.email}>
							<Input
								placeholder="me@example.ru"
								{...register("email", {
									required: "Заполните поле",
									pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
								})}
							/>
						</Field>
					</Stack>
				</HStack>
				<Field label="Местоположение" invalid={!!errors.location}>
					<Input placeholder="Заполните поле" {...register("location")} />
				</Field>
				<Field label="О себе" invalid={!!errors.location}>
					<Textarea
						variant="outline"
						placeholder="Расскажите о себе"
						{...register("bio")}
					/>
				</Field>

				<Button type="submit">Сохранить</Button>
			</Stack>
		</form>
	);
};
