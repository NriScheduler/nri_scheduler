import { h } from "preact";
import { useEffect, useState } from "preact/hooks";

import {
	Button,
	Container,
	Heading,
	HStack,
	Input,
	Separator,
	Stack,
	Textarea,
} from "@chakra-ui/react";
import { useStore } from "@nanostores/preact";

import { ProfileComplete } from "./profile-autocomplete";
import { ProfilePicture } from "./profile-picture";
import { TimesonesList } from "../regions/timezones";
import { TimezoneRadioGroup } from "../../radio-group";
import { Field } from "../../ui/field";
import { toaster } from "../../ui/toaster";
import {
	ETzVariant,
	getMyProfile,
	readCitiesList,
	updateMyProfile,
} from "../../../api";
import { $regions } from "../../../store/regions";
import { navBack, useAuthVerification } from "../../../utils";

type ProfileFormData = {
	nickname: string;
	about: string | null;
	region: string | null;
	city: string | null;
	timezoneOffset: number | null;
	tzVariant: ETzVariant;
};

export const ProfileEdit = () => {
	const { profile, isAuthenticated } = useAuthVerification();
	const allRegions = useStore($regions);

	if (!isAuthenticated || !profile) {
		return null;
	}

	const [formData, setFormData] = useState<ProfileFormData>({
		nickname: profile.nickname ?? "",
		about: profile.about_me ?? null,
		region: profile.region ?? null,
		city: profile.city ?? null,
		timezoneOffset: profile.timezone_offset ?? null,
		tzVariant: profile.tz_variant ?? ETzVariant.DEVICE,
	});

	const [citiesOptions, setCitiesOptions] = useState<string[]>([]);

	useEffect(() => {
		const loadCities = async () => {
			if (formData.region) {
				const res = await readCitiesList(formData.region);
				if (res) {
					setCitiesOptions(res.payload.map(({ name }) => name));
				}
			}
		};
		loadCities();
	}, [formData.region]);

	const handleInputChange = (
		field: keyof ProfileFormData,
		value: string | number | null,
	) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSelectRadio = (value: string) => {
		const newVariant = value as ETzVariant;

		if (newVariant === ETzVariant.OWN) {
			handleInputChange("timezoneOffset", null);
		} else if (newVariant === ETzVariant.DEVICE) {
			const timezoneOffset = -new Date().getTimezoneOffset() / 60;
			handleInputChange("timezoneOffset", timezoneOffset);
		} else if (newVariant === ETzVariant.CITY && formData.city) {
			handleInputChange("timezoneOffset", profile.timezone_offset ?? null);
		}
		handleInputChange("tzVariant", value as ETzVariant);
	};

	const handleSubmit = async () => {
		const { nickname, about, city, timezoneOffset, tzVariant } = formData;

		if (
			!nickname ||
			(tzVariant === ETzVariant.CITY && !city) ||
			(tzVariant === ETzVariant.OWN && !timezoneOffset)
		) {
			return;
		}

		const res = await updateMyProfile(
			nickname,
			about,
			city,
			timezoneOffset,
			tzVariant,
		);

		if (res) {
			await getMyProfile();
			navBack();
			toaster.success({
				title: res.result,
			});
		}
	};

	const isSubmitDisabled =
		!formData.nickname ||
		(formData.tzVariant === ETzVariant.CITY && !formData.city) ||
		(formData.tzVariant === ETzVariant.OWN && !formData.timezoneOffset);

	return (
		<Container mb={6}>
			<Button type="button" onClick={navBack}>
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
				<Stack w="1/2" gap={4}>
					<ProfilePicture link={profile.avatar_link} />
					<Field label="Имя пользователя" invalid={!formData.nickname}>
						<Input
							name="nickname"
							placeholder="Заполните поле"
							required
							value={formData.nickname}
							onChange={(e) =>
								handleInputChange("nickname", e.currentTarget.value)
							}
						/>
					</Field>
					<Field label="О себе">
						<Textarea
							name="about_me"
							placeholder="Расскажите о себе"
							variant="outline"
							autoresize
							value={formData.about || ""}
							onChange={(e) =>
								handleInputChange("about", e.currentTarget.value)
							}
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
				<Stack w="1/2" gap={4}>
					<Field
						label="Город"
						invalid={
							formData.tzVariant === ETzVariant.CITY && !formData.city
						}
					>
						<ProfileComplete
							value={formData.city || ""}
							placeholder="Выберите город"
							options={citiesOptions}
							handleChange={(e) => handleInputChange("city", e)}
						/>
					</Field>
					<Field label="Регион">
						<ProfileComplete
							value={formData.region || ""}
							placeholder="Выберите регион"
							options={allRegions.map((region) => region.name)}
							handleChange={(value) => {
								if (
									value &&
									formData.region &&
									value !== formData.region
								) {
									handleInputChange("city", null);
								}
								handleInputChange("region", value);
							}}
						/>
					</Field>
					<Field
						label="Часовой пояс"
						disabled={formData.tzVariant !== ETzVariant.OWN}
						invalid={
							formData.tzVariant === ETzVariant.OWN &&
							!formData.timezoneOffset
						}
					>
						<TimesonesList
							value={formData.timezoneOffset}
							onChange={(value) =>
								handleInputChange("timezoneOffset", value)
							}
						/>
					</Field>
					<TimezoneRadioGroup
						value={formData.tzVariant}
						onChange={(value) => handleSelectRadio(value)}
					/>
				</Stack>

				<Button
					mt={6}
					type="button"
					disabled={isSubmitDisabled}
					onClick={handleSubmit}
				>
					Сохранить изменения
				</Button>
			</form>
		</Container>
	);
};
