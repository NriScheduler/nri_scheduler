import type { UUID } from "node:crypto";

import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { Controller, useForm } from "react-hook-form";

import {
	Button,
	Card,
	CardBody,
	Checkbox,
	createListCollection,
	Group,
	HStack,
	Input,
	InputAddon,
	Stack,
} from "@chakra-ui/react";
import {
	AutoComplete,
	AutoCompleteGroup,
	AutoCompleteInput,
	AutoCompleteItem,
	AutoCompleteList,
} from "@choc-ui/chakra-autocomplete";
import dayjs from "dayjs";

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
import { toaster } from "../../ui/toaster";
import {
	createEvent,
	IApiCompany,
	IApiLocation,
	readLocations,
	readMyCompanies,
} from "../../../api";
import { EVENT_FORMAT, YYYY_MM_DD } from "../../../utils";

interface IFormCreateEvent {
	readonly company: UUID;
	readonly location: UUID;
	readonly start: string;
	readonly startTime: string;
	readonly max_slots: number | null;
	readonly plan_duration: number | null;
	readonly isMax_slots: boolean;
	readonly isPlan_duration: boolean;
	readonly region: string;
	readonly city: string;
}

export interface IEventProps {
	readonly openDraw: boolean;
	readonly setOpenDraw: (val: boolean) => void;
	readonly companyList: ReadonlyArray<IApiCompany>;
	readonly setCompanyList: (List: ReadonlyArray<IApiCompany>) => void;
	readonly tz: string;
	readonly getNewEvent: (id: UUID) => void;
	readonly profileRegion: string | null;
	readonly profileCity: string | null;
}

const Event = (props: IEventProps) => {
	const [locationList, setLocationList] = useState<
		ReadonlyArray<IApiLocation>
	>([]);

	const [
		isDisableCreateEventSubmitButton,
		setIsDisableCreateEventSubmitButton,
	] = useState(false);

	const [isDisableCreateEventButton, setIsDisableCreateEventButton] =
		useState(false);

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		reset,
		control,
		clearErrors,
		formState: { errors },
	} = useForm<IFormCreateEvent>({
		mode: "onChange",
	});

	const [isStart] = watch(["start"]);

	const isMaxSlotsChecked = watch("isMax_slots");
	const isMaxDuration = watch("isPlan_duration");

	const validateDate = (value: string) => {
		clearErrors("startTime");
		const fieldDate = dayjs.tz(`${value} 12:00`, EVENT_FORMAT, props.tz);
		const nowDate = dayjs().tz(props.tz);
		if (
			nowDate.isSame(fieldDate, "day") ||
			fieldDate.isAfter(nowDate, "day")
		) {
			return true;
		} else {
			return "Вы указали прошлый день";
		}
	};

	const validateTime = (value: string) => {
		if (!isStart) {
			return "Укажите дату";
		}
		const fultime = dayjs.tz(`${isStart} ${value}`, EVENT_FORMAT, props.tz);
		const nowDate = dayjs().tz(props.tz);
		if (
			nowDate.isSame(fultime, "minute") ||
			fultime.isAfter(nowDate, "minute")
		) {
			return true;
		} else {
			return "Вы указали прошлое время";
		}
	};

	const getCompanies = () => {
		return readMyCompanies().then((responce) => {
			if (responce?.payload) {
				props.setCompanyList(responce.payload);
			}
			return responce?.payload || null;
		});
	};

	const getLocations = () => {
		return readLocations().then((responce) => {
			if (responce?.payload) {
				setLocationList(responce.payload);
			}
			return responce?.payload || null;
		});
	};

	const companies = useMemo(() => {
		return createListCollection({
			items: props.companyList,
			itemToString: (item) => item.name,
			itemToValue: (item) => item.id,
		});
	}, [props.companyList]);

	const locations = useMemo(() => {
		return createListCollection({
			items: locationList,
			itemToString: (item) => item.name,
			itemToValue: (item) => item.id,
		});
	}, [locationList]);

	const onSubmit = handleSubmit((data) => {
		const { company, location, start, startTime, max_slots, plan_duration } =
			data;

		const date = dayjs.tz(`${start} ${startTime}`, EVENT_FORMAT, props.tz);

		setIsDisableCreateEventSubmitButton(true);
		createEvent(
			company,
			date.toISOString(),
			location,
			Number(max_slots) || null,
			Number(plan_duration) || null,
		)
			.then((res) => {
				if (res) {
					toaster.success({ title: "Событие успешно создано" });
					props.setOpenDraw(false);
					props.getNewEvent(res.payload);
					reset();
				}
			})
			.finally(() => {
				setIsDisableCreateEventSubmitButton(false);
			});
	});

	useEffect(() => {
		if (isMaxSlotsChecked) {
			setValue("max_slots", null); // Обнуляем значение
		}
		if (isMaxDuration) {
			setValue("plan_duration", null); // Обнуляем значение
		}
	}, [isMaxSlotsChecked, isMaxDuration, setValue]);

	return (
		<DrawerRoot
			open={props.openDraw}
			onOpenChange={(e) => {
				if (e.open) {
					setIsDisableCreateEventButton(true);
					Promise.all([getCompanies(), getLocations()]).then(
						([companiesResult, locationsResult]) => {
							if (companiesResult === null || locationsResult === null) {
								setIsDisableCreateEventButton(false);
								return;
							}
							props.setOpenDraw(e.open);
							setIsDisableCreateEventButton(false);
						},
					);
				} else {
					props.setOpenDraw(e.open);
				}
			}}
		>
			<DrawerBackdrop />
			<DrawerTrigger asChild>
				<Button
					disabled={isDisableCreateEventButton}
					// variant="outline"
					size={{ base: "xs", md: "md" }}
				>
					Добавить событие
				</Button>
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Создание события</DrawerTitle>
				</DrawerHeader>
				<DrawerBody>
					<form onSubmit={onSubmit}>
						<Stack gap="4" w="full">
							<Field
								label="Кампания *"
								helperText={
									companies.items.length > 0
										? ""
										: "Сначала создайте кампанию"
								}
								errorText={errors.company?.message}
								invalid={!!errors.company?.message}
							>
								<Controller
									name="company"
									control={control}
									rules={{ required: "Выберите кампанию" }}
									render={({ field }) => (
										<AutoComplete
											onChange={field.onChange}
											openOnFocus
											freeSolo
											value={field.value}
											emptyState="Ничего не найдено"
										>
											<AutoCompleteInput
												variant="outline"
												onBlur={field.onBlur}
												ref={field.ref}
												disabled={companies.items.length < 1}
											/>
											<AutoCompleteList bg="inherit">
												<AutoCompleteGroup>
													{companies.items.map((c) => (
														<AutoCompleteItem
															key={c.id}
															value={{ title: c.id }}
															label={c.name}
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

							<HStack alignItems="start" gap={2} width="full">
								<Field
									label="Начало"
									errorText={errors.start?.message}
									invalid={!!errors.start?.message}
								>
									<Input
										type="date"
										min={dayjs().tz(props.tz).format(YYYY_MM_DD)}
										{...register("start", {
											required: "Заполните поле",
											validate: validateDate,
										})}
									/>
								</Field>
								<Field
									label="Время"
									errorText={errors.startTime?.message}
									invalid={!!errors.startTime?.message}
								>
									<Input
										type="time"
										{...register("startTime", {
											required: "Заполните поле",
											validate: validateTime,
										})}
									/>
								</Field>
							</HStack>

							<Card.Root>
								<Card.Body padding={2}>
									<Field
										label="Локация *"
										helperText={
											locations.items.length > 0
												? ""
												: "Сначала создайте локацию"
										}
										errorText={errors.location?.message}
										invalid={!!errors.location?.message}
									>
										<Controller
											name="location"
											control={control}
											rules={{ required: "Выберите локацию" }}
											render={({ field }) => (
												<AutoComplete
													onChange={field.onChange}
													openOnFocus
													freeSolo
													value={field.value}
													emptyState="Ничего не найдено"
												>
													<AutoCompleteInput
														variant="outline"
														onBlur={field.onBlur}
														ref={field.ref}
														disabled={locations.items.length < 1}
													/>
													<AutoCompleteList bg="inherit">
														<AutoCompleteGroup>
															{locations.items.map((option) => (
																<AutoCompleteItem
																	key={option.id}
																	value={{
																		title: option.id,
																	}}
																	label={option.name}
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
								</Card.Body>
							</Card.Root>

							<Card.Root>
								<CardBody padding={2}>
									<Field
										label="Максимальное количество игроков"
										errorText={errors.max_slots?.message}
										invalid={
											!!errors.max_slots?.message &&
											!isMaxSlotsChecked
										}
									>
										<Input
											type="number"
											placeholder="Заполните поле"
											disabled={isMaxSlotsChecked}
											{...register("max_slots", {
												validate: (value) => {
													if (!isMaxSlotsChecked && !value) {
														return "Укажите количество игроков";
													}
													return true;
												},
											})}
										/>
									</Field>
									<Controller
										name="isMax_slots"
										control={control}
										render={({ field }) => (
											<Checkbox.Root
												mt={2}
												checked={field.value}
												onCheckedChange={({ checked }) =>
													field.onChange(checked)
												}
											>
												<Checkbox.HiddenInput />
												<Checkbox.Control />
												<Checkbox.Label>
													Без ограничений
												</Checkbox.Label>
											</Checkbox.Root>
										)}
									/>
								</CardBody>
							</Card.Root>

							<Card.Root>
								<CardBody padding={2}>
									<Field
										label="Планируемая длительность"
										errorText={errors.plan_duration?.message}
										invalid={
											!!errors.plan_duration?.message &&
											!isMaxDuration
										}
									>
										<Group attached w="full">
											<Input
												type="number"
												placeholder="Заполните поле"
												min="1"
												step="1"
												disabled={isMaxDuration}
												{...register("plan_duration", {
													validate: (value) => {
														if (!isMaxDuration && !value) {
															return "Укажите продолжительность";
														}
														return true;
													},
												})}
											/>
											<InputAddon>час</InputAddon>
										</Group>
									</Field>

									<Controller
										name="isPlan_duration"
										control={control}
										render={({ field }) => (
											<Checkbox.Root
												mt={2}
												checked={field.value}
												onCheckedChange={({ checked }) =>
													field.onChange(checked)
												}
											>
												<Checkbox.HiddenInput />
												<Checkbox.Control />
												<Checkbox.Label>
													Без ограничений
												</Checkbox.Label>
											</Checkbox.Root>
										)}
									/>
								</CardBody>
							</Card.Root>
						</Stack>
						<Button
							disabled={isDisableCreateEventSubmitButton}
							type="submit"
							w="full"
							mt={6}
						>
							Создать
						</Button>
					</form>
				</DrawerBody>
				<DrawerCloseTrigger />
			</DrawerContent>
		</DrawerRoot>
	);
};

export default Event;
