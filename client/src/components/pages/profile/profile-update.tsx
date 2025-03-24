import { h } from "preact";

import { useForm } from "react-hook-form";

import {
	Avatar,
	Button,
	Checkbox,
	Group,
	Heading,
	HStack,
	Input,
	NativeSelect,
	Separator,
	Stack,
	Textarea,
} from "@chakra-ui/react";
import { Field } from "../../ui/field";
import { useState } from "preact/hooks";
import { API_HOST, setUserAvatar } from "../../../api";
import toast from "react-hot-toast";

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
			avatar: "",
			email: user?.email,
		},
	});

	const regions = [
		{
			region: "Московская область",
			cities: ["Москва", "Подольск", "Химки"],
			timezone: "Europe/Moscow",
		},
		{
			region: "Свердловская область",
			cities: ["Екатеринбург", "Нижний Тагил", "Каменск-Уральский"],
			timezone: "Asia/Yekaterinburg",
		},
		{
			region: "Красноярский край",
			cities: ["Красноярск", "Норильск", "Ачинск"],
			timezone: "Asia/Krasnoyarsk",
		},
	];

	const [selectedRegion, setSelectedRegion] = useState<string>("");
	const [selectedCity, setSelectedCity] = useState<string>("");
	const [selectedTimezone, setSelectedTimezone] = useState<string>("");

	const cities =
		regions.find((r) => r.region === selectedRegion)?.cities || [];
	const timezone =
		regions.find((r) => r.region === selectedRegion)?.timezone || "";

	const onSubmit = handleSubmit((data) => {
		// console.log(data);
		const userAvatar = data.avatar;

		if (userAvatar) {
			setUserAvatar(userAvatar)
				.then((res) => {
					if (res != null) {
						toast.success("Фото профиля успешно обновлено!");
					}
				})
				.catch((error) => {
					toast.error("Не удалось обновить фото");
					console.log(error);
				});
		}
	});

	return (
		<form onSubmit={onSubmit}>
			{/* Персональная информация */}
			<HStack py={6}>
				<Heading size="xl" flexShrink="0">
					Персональная информация
				</Heading>
				<Separator flex="1" />
			</HStack>
			<Stack>
				<Avatar.Root w="100px" h="100px">
					<Avatar.Fallback name={user?.nickname} />
					<Avatar.Image src={`${API_HOST + "/api" + user?.avatar_link}`} />
				</Avatar.Root>

				<Group w="full">
					<Field label="Фото профиля" invalid={!!errors.avatar}>
						<Input
							placeholder="Вставьте ссылку"
							{...register("avatar")}
						/>
					</Field>
					<Field label="Имя пользователя" invalid={!!errors.nickname}>
						<Input
							placeholder="Заполните поле"
							{...register("nickname")}
						/>
					</Field>
				</Group>
				<Field label="О себе" invalid={!!errors.location}>
					<Textarea
						variant="outline"
						autoresize
						placeholder="Расскажите о себе"
						{...register("bio")}
					/>
				</Field>
			</Stack>

			{/* Контактная информация */}
			<HStack py={6}>
				<Heading size="xl" flexShrink="0">
					Контактная информация
				</Heading>
				<Separator flex="1" />
			</HStack>
			<Stack>
				<Group w="full">
					<Field label="Электронная почта" invalid={!!errors.email}>
						<Input
							placeholder="me@example.ru"
							{...register("email", {
								required: "Заполните поле",
								pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
							})}
						/>
					</Field>
				</Group>
				<Field label="Регион">
					<NativeSelect.Root>
						<NativeSelect.Field
							placeholder="Выберите регион"
							defaultValue={selectedRegion}
							onChange={(event) => {
								setSelectedRegion(event.currentTarget.value);
								setSelectedCity("");
								setSelectedTimezone("");
							}}
						>
							{regions.map((region) => (
								<option value={region.region} key={region.region}>
									{region.region}
								</option>
							))}
						</NativeSelect.Field>
						<NativeSelect.Indicator />
					</NativeSelect.Root>
				</Field>
				<Group w="full">
					<Field label="Город">
						<NativeSelect.Root disabled={!selectedRegion}>
							<NativeSelect.Field
								placeholder="Выберите город"
								defaultValue={selectedCity}
								onChange={(event) => {
									setSelectedCity(event.currentTarget.value);
								}}
							>
								{cities.map((city) => (
									<option value={city} key={city}>
										{city}
									</option>
								))}
							</NativeSelect.Field>
							<NativeSelect.Indicator />
						</NativeSelect.Root>
					</Field>
					<Field label="Часовой пояс">
						<Input
							placeholder="Часовой пояс"
							defaultValue={selectedTimezone || timezone}
							readOnly
						/>
					</Field>
				</Group>
				<Group mt={2}>
					<Checkbox.Root>
						<Checkbox.HiddenInput />
						<Checkbox.Control>
							<Checkbox.Indicator />
						</Checkbox.Control>
						<Checkbox.Label>Брать из региона</Checkbox.Label>
					</Checkbox.Root>
					<Checkbox.Root>
						<Checkbox.HiddenInput />
						<Checkbox.Control>
							<Checkbox.Indicator />
						</Checkbox.Control>
						<Checkbox.Label>Брать с устройства</Checkbox.Label>
					</Checkbox.Root>
				</Group>
			</Stack>

			<Button type="submit" mt={6}>
				Сохранить изменения
			</Button>
		</form>
	);
};
