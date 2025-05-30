import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { Controller, useForm } from "react-hook-form";

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

	if (!isAuthenticated || !profile) {
		return null;
	}

	const allRegions = useStore($regions);
	const [citiesOptions, setCitiesOptions] = useState<string[]>([]);

	const {
		handleSubmit,
		setValue,
		watch,
		control,
		formState: { errors, isSubmitting, isValid },
	} = useForm<ProfileFormData>({
		mode: "onChange",
		defaultValues: {
			nickname: profile?.nickname ?? "",
			about: profile?.about_me ?? null,
			region: profile?.region ?? null,
			city: profile?.city ?? null,
			timezoneOffset: profile?.timezone_offset ?? null,
			tzVariant: profile?.tz_variant ?? ETzVariant.DEVICE,
		},
	});

	const currentTzVariant = watch("tzVariant");
	const currentRegion = watch("region");
	const currentCity = watch("city");

	useEffect(() => {
		const loadCities = async () => {
			if (currentRegion) {
				const res = await readCitiesList(currentRegion);
				if (res) {
					setCitiesOptions(res.payload.map(({ name }) => name));
				}
			}
		};
		loadCities();
	}, [currentRegion]);

	useEffect(() => {
		if (currentTzVariant === ETzVariant.DEVICE) {
			setValue("timezoneOffset", -new Date().getTimezoneOffset() / 60);
		} else if (currentTzVariant === ETzVariant.CITY && currentCity) {
			setValue("timezoneOffset", profile?.timezone_offset ?? null);
		} else if (currentTzVariant === ETzVariant.OWN) {
			setValue("timezoneOffset", null);
		}
	}, [currentTzVariant, currentCity]);

	const onSubmit = async (data: ProfileFormData) => {
		const res = await updateMyProfile(
			data.nickname,
			data.about,
			data.city,
			data.timezoneOffset,
			data.tzVariant,
		);

		if (res) {
			await getMyProfile();
			navBack();
			toaster.success({
				title: res.result,
			});
		}
	};

	return (
		<Container mb={6}>
			<Button type="button" onClick={navBack}>
				Вернуться назад
			</Button>

			<form onSubmit={handleSubmit(onSubmit)}>
				{/* Персональная информация */}
				<HStack py={6}>
					<Heading size="xl" flexShrink="0">
						Персональная информация
					</Heading>
					<Separator flex="1" />
				</HStack>
				<Stack w="1/2" gap={4}>
					<ProfilePicture nickname={profile.nickname} />
					<Field label="Имя пользователя" invalid={!!errors.nickname}>
						<Controller
							name="nickname"
							control={control}
							rules={{ required: "Обязательное поле" }}
							render={({ field }) => (
								<Input {...field} placeholder="Заполните поле" />
							)}
						/>
					</Field>
					<Field label="О себе">
						<Controller
							name="about"
							control={control}
							render={({ field }) => (
								<Textarea
									{...field}
									placeholder="Расскажите о себе"
									variant="outline"
									value={field.value || ""}
								/>
							)}
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
					<Field label="Город" invalid={!!errors.city}>
						<Controller
							name="city"
							control={control}
							rules={{
								required: "Выберите город",
							}}
							render={({ field }) => (
								<ProfileComplete
									options={citiesOptions}
									value={field.value}
									onChange={field.onChange}
									onBlur={field.onBlur}
									placeholder="Выберите город"
								/>
							)}
						/>
					</Field>

					<Field label="Регион" invalid={!!errors.region}>
						<Controller
							name="region"
							control={control}
							rules={{
								required: "Выберите регион",
							}}
							render={({ field }) => (
								<ProfileComplete
									options={allRegions.map((region) => region.name)}
									value={field.value}
									onChange={field.onChange}
									onBlur={field.onBlur}
									placeholder="Выберите регион"
								/>
							)}
						/>
					</Field>

					<Field
						label="Часовой пояс"
						disabled={currentTzVariant !== ETzVariant.OWN}
						invalid={
							currentTzVariant === ETzVariant.OWN &&
							!watch("timezoneOffset")
						}
					>
						<Controller
							name="timezoneOffset"
							control={control}
							render={({ field }) => (
								<TimesonesList
									value={field.value}
									onChange={field.onChange}
								/>
							)}
						/>
					</Field>

					<Controller
						name="tzVariant"
						control={control}
						render={({ field }) => (
							<TimezoneRadioGroup
								value={field.value}
								onChange={field.onChange}
							/>
						)}
					/>
				</Stack>

				<Button
					mt={6}
					type="submit"
					loading={isSubmitting}
					disabled={!isValid || Object.keys(errors).length > 0}
				>
					Сохранить изменения
				</Button>
			</form>
		</Container>
	);
};

export default ProfileEdit;
