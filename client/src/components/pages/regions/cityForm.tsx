import { h } from "preact";
import { useState } from "preact/hooks";
import { Controller, useForm } from "react-hook-form";

import {
	Button,
	Checkbox,
	Heading,
	HStack,
	Input,
	Separator,
	Stack,
} from "@chakra-ui/react";
import {
	AutoComplete,
	AutoCompleteGroup,
	AutoCompleteInput,
	AutoCompleteItem,
	AutoCompleteList,
} from "@choc-ui/chakra-autocomplete";

import { TimesonesList } from "./timezones";
import { Field } from "../../ui/field";
import { toaster } from "../../ui/toaster";
import { addCity } from "../../../api";

interface IRegionOption {
	name: string;
	timezone: string;
}

interface ICityFormProps {
	regionOptions: IRegionOption[];
	loading: boolean;
}

interface IFormAddCity {
	readonly name: string;
	readonly timezone: string;
	readonly region: string;
	readonly useRegionTimezone: boolean;
}

export const CityForm = ({ regionOptions, loading }: ICityFormProps) => {
	const [cityLoading, setCityLoading] = useState(false);

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		control,
		formState: { errors },
	} = useForm<IFormAddCity>({
		mode: "onChange",
		defaultValues: {
			timezone: "",
			region: "",
			name: "",
			useRegionTimezone: true,
		},
	});

	const selectedRegionName = watch("region");
	const shouldUseRegionTimezone = watch("useRegionTimezone");
	const selectedRegion = regionOptions.find(
		(r) => r.name === selectedRegionName,
	);

	// Автоматически устанавливаем часовой пояс города при выборе региона
	const handleRegionChange = (regionName: string) => {
		const region = regionOptions.find((r) => r.name === regionName);
		if (region && shouldUseRegionTimezone) {
			setValue("timezone", region.timezone, { shouldValidate: true });
		}
	};

	const onSubmit = handleSubmit(async (data: IFormAddCity) => {
		const { name, timezone, region, useRegionTimezone } = data;
		setCityLoading(true);

		try {
			const timezoneToSend = useRegionTimezone ? null : timezone;
			const res = await addCity(name, region, timezoneToSend);
			if (res) {
				toaster.success({
					title: res.result,
				});
				setValue("name", "");
				setValue("timezone", "");
				setValue("region", "");
				setValue("useRegionTimezone", true);
			}
		} finally {
			setCityLoading(false);
		}
	});

	// Обработчик изменения чекбокса
	const handleCheckboxChange = (checked: boolean) => {
		setValue("useRegionTimezone", checked);
		if (checked && selectedRegion) {
			// Если включаем "Брать из региона", устанавливаем таймзону региона
			setValue("timezone", selectedRegion.timezone);
		}
	};

	return (
		<Stack py={6}>
			<HStack pb={4}>
				<Heading size="xl" flexShrink="0">
					Добавление города
				</Heading>
				<Separator flex="1" />
			</HStack>
			<form onSubmit={onSubmit}>
				<Stack w="1/2" gap={4}>
					<Field
						label="Регион"
						errorText={errors.region?.message}
						invalid={!!errors.region}
					>
						<Controller
							name="region"
							control={control}
							rules={{
								required: "Выберите регион",
							}}
							render={({ field }) => (
								<AutoComplete
									onChange={(value: string) => {
										field.onChange(value);
										handleRegionChange(value);
									}}
									openOnFocus
									freeSolo
									value={field.value}
									emptyState="Ничего не найдено"
								>
									<AutoCompleteInput
										variant="outline"
										onBlur={field.onBlur}
										ref={field.ref}
										disabled={loading}
										placeholder="Выберите регион"
									/>
									<AutoCompleteList bg="inherit">
										<AutoCompleteGroup>
											{regionOptions.map((region) => (
												<AutoCompleteItem
													key={region.name}
													value={region.name}
													label={region.name}
													textTransform="capitalize"
													_hover={{
														bg: "gray.200",
													}}
												/>
											))}
										</AutoCompleteGroup>
									</AutoCompleteList>
								</AutoComplete>
							)}
						/>
					</Field>

					<Field
						label="Наименование города"
						errorText={errors.name?.message}
						invalid={!!errors.name}
					>
						<Input
							{...register("name", {
								required: "Заполните поле",
								minLength: {
									value: 2,
									message: "Минимум 2 символа",
								},
								maxLength: {
									value: 32,
									message: "Максимум 32 символов",
								},
							})}
						/>
					</Field>

					<Field
						label="Часовой пояс"
						errorText={errors.timezone?.message}
						invalid={!!errors.timezone}
						disabled={shouldUseRegionTimezone}
					>
						<Controller
							name="timezone"
							control={control}
							rules={{
								required: !shouldUseRegionTimezone
									? "Выберите часовой пояс"
									: false,
							}}
							render={({ field }) => <TimesonesList {...field} />}
						/>
					</Field>

					<Controller
						control={control}
						name="useRegionTimezone"
						render={({ field }) => (
							<Checkbox.Root
								checked={field.value}
								onCheckedChange={({ checked }) => {
									const isChecked = !!checked;
									handleCheckboxChange(isChecked);
								}}
							>
								<Checkbox.HiddenInput />
								<Checkbox.Control />
								<Checkbox.Label>Брать из региона</Checkbox.Label>
							</Checkbox.Root>
						)}
					/>
					<Button
						disabled={cityLoading}
						type="submit"
						w="fit-content"
						ml="auto"
					>
						{cityLoading ? "Добавление..." : "Добавить город"}
					</Button>
				</Stack>
			</form>
		</Stack>
	);
};
