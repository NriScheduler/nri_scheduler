import { h } from "preact";
import { useState } from "preact/hooks";
import { Controller, useForm } from "react-hook-form";

import {
	Button,
	Heading,
	HStack,
	Input,
	Separator,
	Stack,
} from "@chakra-ui/react";

import { TimesonesList } from "./timezones";
import { Field } from "../../ui/field";
import { toaster } from "../../ui/toaster";
import { addRegion } from "../../../api";
import { TIMEZONES } from "../../../store/profile";
import { loadRegions } from "../../../store/regions";

interface IFormAddRegion {
	readonly name: string;
	readonly offset: number;
}

export const RegionForm = () => {
	const [regionLoading, setRegionLoading] = useState(false);

	const {
		register,
		handleSubmit,
		setValue,
		control,
		formState: { errors },
	} = useForm<IFormAddRegion>({
		mode: "onChange",
		defaultValues: {
			offset: undefined,
		},
	});

	const onSubmit = handleSubmit(async (data) => {
		const { name, offset } = data;
		const timezone = TIMEZONES.get(offset)!;

		setRegionLoading(true);
		try {
			const res = await addRegion(name, timezone);
			if (res) {
				toaster.success({
					title: res.result,
				});
				loadRegions();
				setValue("name", "");
				setValue("offset", "" as unknown as number);
			}
		} finally {
			setRegionLoading(false);
		}
	});

	return (
		<Stack py={6}>
			<HStack pb={4}>
				<Heading size="xl" flexShrink="0">
					Добавление региона
				</Heading>
				<Separator flex="1" />
			</HStack>
			<form onSubmit={onSubmit}>
				<Stack w="1/2" gap={4}>
					<Field
						label="Регион"
						errorText={errors.name?.message}
						invalid={!!errors.name}
					>
						<Input
							placeholder="Наименование региона"
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
						errorText={errors.offset?.message}
						invalid={!!errors.offset}
					>
						<Controller
							name="offset"
							control={control}
							rules={{
								required: "Выберите часовой пояс",
							}}
							render={({ field }) => <TimesonesList {...field} />}
						/>
					</Field>

					<Button
						disabled={regionLoading}
						type="submit"
						w="fit-content"
						ml="auto"
					>
						{regionLoading ? "Добавление..." : "Добавить регион"}
					</Button>
				</Stack>
			</form>
		</Stack>
	);
};
