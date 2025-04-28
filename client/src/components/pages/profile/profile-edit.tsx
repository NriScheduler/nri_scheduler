import { h } from "preact";
import { useEffect, useState } from "preact/hooks";

import {
	Button,
	Container,
	Group,
	Heading,
	HStack,
	Input,
	NativeSelect,
	RadioGroup,
	Separator,
	Stack,
	Textarea,
} from "@chakra-ui/react";
import { useStore } from "@nanostores/preact";

import { ProfilePicture } from "./profile-picture";
import { Field } from "../../ui/field";
import { toaster } from "../../ui/toaster";
import {
	ETzVariant,
	getMyProfile,
	readCitiesList,
	readRegionsList,
	updateMyProfile,
} from "../../../api";
import { $profile, TIMEZONES } from "../../../store/profile";
import { navBack, useAuthGuard } from "../../../utils";

export const ProfileEdit = () => {
	const user = useStore($profile);

	const { isAuthenticated } = useAuthGuard();

	if (!isAuthenticated || !user) {
		return null;
	}

	const [nickname, setNickname] = useState(user.nickname ?? "");
	const [about, setAbout] = useState(user.about_me);
	const [selectedRegion, setRegion] = useState(user.region);
	const [selectedCity, setCity] = useState(user.city);
	const [selectedTimezone, setSelectedTimezone] = useState(
		user.timezone_offset,
	);
	const [tzVariant, setTzVariant] = useState(
		user.tz_variant || ETzVariant.DEVICE,
	);

	const [regionsOptions, setRegionsOptions] = useState<string[]>(
		[user.region || ""].filter(Boolean),
	);
	const [citiesOptions, setCitiesOptions] = useState<string[]>(
		[user.city || ""].filter(Boolean),
	);

	useEffect(() => {
		readRegionsList().then((res) => {
			if (res) {
				setRegionsOptions(res.payload.map(({ name }) => name));
			}
		});
	}, []);

	useEffect(() => {
		readCitiesList(selectedRegion).then((res) => {
			if (res) {
				setCitiesOptions(res.payload.map(({ name }) => name));
			}
		});
	}, [selectedRegion]);

	const tzOptions = Array.from(TIMEZONES.entries())
		.sort(([a], [b]) => b - a)
		.map(([offset, tzName]) => (
			<option value={offset} key={offset}>
				{`${offset < 0 ? offset : "+" + offset} (${tzName})`}
			</option>
		));

	return (
		<Container mb={6}>
			<Button type="button" onClick={navBack} mb={4}>
				Вернуться назад
			</Button>

			<form>
				{/* Персональная информация */}
				<HStack py={6}>
					<Heading size="xl" flexShrink="0">
						Персональная информация
					</Heading>
					<Separator flex="1" />
				</HStack>
				<Stack>
					<ProfilePicture link={user.avatar_link ?? ""} />
					<Field label="Имя пользователя" invalid={!nickname}>
						<Input
							name="nickname"
							placeholder="Заполните поле"
							required
							value={nickname}
							onChange={(e) => setNickname(e.currentTarget.value)}
						/>
					</Field>
					<Field label="О себе">
						<Textarea
							name="about_me"
							placeholder="Расскажите о себе"
							variant="outline"
							autoresize
							value={about as string}
							onChange={(e) => setAbout(e.currentTarget.value)}
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
						<Field
							label="Город"
							invalid={tzVariant === ETzVariant.CITY && !selectedCity}
						>
							<NativeSelect.Root>
								<NativeSelect.Field
									name="city"
									placeholder="Выберите город"
									value={selectedCity as string}
									onChange={(e) =>
										setCity(e.currentTarget.value || null)
									}
								>
									{citiesOptions.map((city) => (
										<option value={city} key={city}>
											{city}
										</option>
									))}
								</NativeSelect.Field>
								<NativeSelect.Indicator />
							</NativeSelect.Root>
						</Field>
						<Field label="Регион">
							<NativeSelect.Root>
								<NativeSelect.Field
									placeholder="Выберите регион"
									value={selectedRegion as string}
									onChange={(event) => {
										const reg = event.currentTarget.value;
										if (
											reg &&
											selectedRegion &&
											reg !== selectedRegion
										) {
											setCity(null);
										}
										setRegion(event.currentTarget.value || null);
									}}
								>
									{regionsOptions.map((reg) => (
										<option value={reg} key={reg}>
											{reg}
										</option>
									))}
								</NativeSelect.Field>
								<NativeSelect.Indicator />
							</NativeSelect.Root>
						</Field>
					</Group>
					<Group mt={2}>
						<Field
							label="Часовой пояс"
							disabled={tzVariant !== ETzVariant.OWN}
							invalid={tzVariant === ETzVariant.OWN && !selectedTimezone}
						>
							<NativeSelect.Root>
								<NativeSelect.Field
									placeholder="Выберите часовой пояс"
									value={selectedTimezone as number}
									onChange={(event) =>
										setSelectedTimezone(
											event.currentTarget.value
												? Number(event.currentTarget.value)
												: null,
										)
									}
								>
									{tzOptions}
								</NativeSelect.Field>
								<NativeSelect.Indicator />
							</NativeSelect.Root>
						</Field>
						<RadioGroup.Root
							value={tzVariant}
							onValueChange={(e) => {
								let tzVar = e.value as ETzVariant;
								if (tzVar !== ETzVariant.OWN) {
									setSelectedTimezone(null);
								}
								setTzVariant(tzVar);
							}}
						>
							<HStack gap="6">
								<RadioGroup.Item
									key={ETzVariant.CITY}
									value={ETzVariant.CITY}
								>
									<RadioGroup.ItemHiddenInput />
									<RadioGroup.ItemIndicator />
									<RadioGroup.ItemText>
										Брать из города
									</RadioGroup.ItemText>
								</RadioGroup.Item>
								<RadioGroup.Item
									key={ETzVariant.DEVICE}
									value={ETzVariant.DEVICE}
								>
									<RadioGroup.ItemHiddenInput />
									<RadioGroup.ItemIndicator />
									<RadioGroup.ItemText>
										Брать с устройства
									</RadioGroup.ItemText>
								</RadioGroup.Item>
								<RadioGroup.Item
									key={ETzVariant.OWN}
									value={ETzVariant.OWN}
								>
									<RadioGroup.ItemHiddenInput />
									<RadioGroup.ItemIndicator />
									<RadioGroup.ItemText>
										Указать вручную
									</RadioGroup.ItemText>
								</RadioGroup.Item>
							</HStack>
						</RadioGroup.Root>
					</Group>
				</Stack>

				<Button
					mt={6}
					type="button"
					disabled={
						!nickname ||
						(tzVariant === ETzVariant.CITY && !selectedCity) ||
						(tzVariant === ETzVariant.OWN && !selectedTimezone)
					}
					onClick={() => {
						updateMyProfile(
							nickname,
							about,
							selectedCity,
							selectedTimezone,
							tzVariant,
						)
							.then((res) => res && getMyProfile())
							.then(
								(res) =>
									res &&
									(navBack(),
									toaster.success({
										title: "Данные профиля обновлены",
									})),
							);
					}}
				>
					Сохранить изменения
				</Button>
			</form>
		</Container>
	);
};
