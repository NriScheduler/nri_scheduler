import { Fragment, h } from "preact";
import { useEffect, useState } from "preact/compat";
import { Control, Controller, useForm, useWatch } from "react-hook-form";

import {
	Box,
	Button,
	ColorPicker,
	HStack,
	Input,
	List,
	parseColor,
	Portal,
	Presence,
	Separator,
	Stack,
	Text,
	Textarea,
	useDisclosure,
} from "@chakra-ui/react";
import { useStore } from "@nanostores/preact";

import {
	DrawerBackdrop,
	DrawerBody,
	DrawerCloseTrigger,
	DrawerContent,
	DrawerHeader,
	DrawerRoot,
	DrawerTitle,
	DrawerTrigger,
} from "../../ui/drawer";
import { Field } from "../../ui/field";
import { addCompany, IApiCompany } from "../../../api";
import { $profile } from "../../../store/profile";
import {
	DEFAULT_EVENT_STYLE,
	IEventStyle,
	stringifyEventStyle,
} from "../../../utils";

export interface ICompanyProps {
	readonly data: ReadonlyArray<IApiCompany>;
}

interface CompanyFormValues extends IApiCompany {
	style: IEventStyle;
}

interface PreviewCompanyProps {
	control: Control<CompanyFormValues>;
	value: string;
}

export const PreviewCompany = ({ control, value }: PreviewCompanyProps) => {
	const { open, onToggle } = useDisclosure();

	const currentStyles = useWatch({
		control,
		name: "style",
	});

	return (
		<Fragment>
			<Stack gap={2}>
				<Box
					p="1"
					background={currentStyles.background}
					borderLeftWidth="4px"
					borderColor={currentStyles.highlight}
					color={currentStyles.text}
					borderRadius="4px"
				>
					{value || "Название кампании"}
				</Box>
				<Presence
					present={open}
					animationName={{ _open: "fade-in", _closed: "fade-out" }}
					animationDuration="moderate"
				>
					<Stack gap={2}>
						{(["background", "highlight", "text"] as const).map(
							(name) => (
								<Controller
									key={name}
									name={`style.${name}`}
									control={control}
									render={({ field }) => (
										<ColorPicker.Root
											value={parseColor(field.value)}
											onValueChange={(e) =>
												field.onChange(e.value.toString("hex"))
											}
											size="xs"
										>
											<ColorPicker.HiddenInput />
											<ColorPicker.Label>
												{name === "background"
													? "Фон"
													: name === "highlight"
														? "Акцент"
														: "Текст"}
											</ColorPicker.Label>
											<ColorPicker.Control>
												<ColorPicker.Input />
												<ColorPicker.Trigger />
											</ColorPicker.Control>
											<Portal>
												<ColorPicker.Positioner zIndex="popover !important">
													<ColorPicker.Content>
														<ColorPicker.Area />
														<HStack>
															<ColorPicker.EyeDropper
																size="xs"
																variant="outline"
															/>
															<ColorPicker.Sliders />
														</HStack>
													</ColorPicker.Content>
												</ColorPicker.Positioner>
											</Portal>
										</ColorPicker.Root>
									)}
								/>
							),
						)}
					</Stack>
				</Presence>
				<Button variant="outline" onClick={onToggle}>
					Изменить стиль
				</Button>
			</Stack>
		</Fragment>
	);
};

const Company = ({ data }: ICompanyProps) => {
	const [open, setOpen] = useState(false);
	const profile = useStore($profile);

	const {
		register,
		handleSubmit,
		reset,
		control,
		watch,
		formState: { errors },
	} = useForm<CompanyFormValues>({
		defaultValues: {
			name: "",
			system: "",
			description: "",
			style: DEFAULT_EVENT_STYLE,
		},
	});

	const onSubmit = handleSubmit((companyData) => {
		if (data) {
			const { name, system, description, style } = companyData;
			const eventStyle = stringifyEventStyle(style);

			addCompany(name, system, {
				description,
				event_style: eventStyle,
			}).then((res) => {
				if (res !== null) {
					reset();
					setOpen(false);
				}
			});
		}
	});

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setOpen(false);
			}
		};

		document.addEventListener("keydown", handleKeyDown, { passive: true });
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			setOpen(false);
		};
	}, []);

	return (
		<DrawerRoot open={open} onOpenChange={(e) => setOpen(e.open)}>
			<DrawerBackdrop />
			<DrawerTrigger asChild>
				<Button
					disabled={!profile?.signed}
					variant="outline"
					size={{ base: "xs", md: "md" }}
				>
					Создать кампанию
				</Button>
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Создание кампании</DrawerTitle>
				</DrawerHeader>
				<DrawerBody>
					<form onSubmit={onSubmit}>
						<Stack gap={2}>
							<HStack>
								<Separator flex="1" />
								<Text flexShrink="0">Данные</Text>
								<Separator flex="1" />
							</HStack>
							<Field
								label="Название *"
								errorText={errors.name?.message}
								invalid={!!errors.name?.message}
							>
								<Input
									placeholder="Заполните поле"
									{...register("name", {
										required: "Заполните поле",
									})}
								/>
							</Field>
							<Field
								label="Система *"
								errorText={errors.system?.message}
								invalid={!!errors.system?.message}
							>
								<Input
									placeholder="Заполните поле"
									{...register("system", {
										required: "Заполните поле",
									})}
								/>
							</Field>
							<Field label="Описание">
								<Textarea
									placeholder="Расскажите о своей кампании"
									{...register("description")}
								/>
							</Field>
						</Stack>

						<Stack gap={2}>
							<HStack mt={2}>
								<Separator flex="1" />
								<Text flexShrink="0">Оформление</Text>
								<Separator flex="1" />
							</HStack>
							<PreviewCompany control={control} value={watch("name")} />
						</Stack>

						<Button type="submit" w="full" mt={4}>
							Создать
						</Button>
					</form>
					<Stack gap={2} mt={4}>
						<HStack>
							<Separator flex="1" />
							<Text flexShrink="0">Ранее созданные кампании</Text>
							<Separator flex="1" />
						</HStack>
						{data?.length ? (
							<List.Root as="ol" ml={4}>
								{data.map((item) => (
									<List.Item key={item.id}>{item.name}</List.Item>
								))}
							</List.Root>
						) : (
							<Text>Список пуст</Text>
						)}
					</Stack>
				</DrawerBody>
				<DrawerCloseTrigger />
			</DrawerContent>
		</DrawerRoot>
	);
};

export default Company;
