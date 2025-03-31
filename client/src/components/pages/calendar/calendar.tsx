import "@schedule-x/theme-default/dist/index.css";
import "./calendar.css";

import type { UUID } from "node:crypto";

import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { route as navigate } from "preact-router";
import { Controller, useForm } from "react-hook-form";

import {
	Button,
	Card,
	CardBody,
	Checkbox,
	Container,
	createListCollection,
	Group,
	HStack,
	Input,
	InputAddon,
	Stack,
	Switch,
} from "@chakra-ui/react";
import {
	AutoComplete,
	AutoCompleteGroup,
	AutoCompleteInput,
	AutoCompleteItem,
	AutoCompleteList,
} from "@choc-ui/chakra-autocomplete";
import { useStore } from "@nanostores/preact";
import { CalendarApp, createViewMonthGrid } from "@schedule-x/calendar";
import { ScheduleXCalendar, useCalendarApp } from "@schedule-x/preact";
import { CalendarAppSingleton } from "@schedule-x/shared";
import dayjs from "dayjs";

import { Company } from "./company";
import { Location } from "./location";
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
import { HoverCard } from "../../ui/hover-card";
import { Warning } from "../../ui/icons";
import { toaster } from "../../ui/toaster";
import {
	createEvent,
	IApiCompany,
	IApiLocation,
	readEvent,
	readEventsList,
	readLocations,
	readMyCompanies,
} from "../../../api";
import {
	$mastery,
	disableMastery,
	enableMastery,
} from "../../../store/mastery";
import { $profile, $tz } from "../../../store/profile";

const EVENT_FORMAT = "YYYY-MM-DD HH:mm";
const DEFAULT_EVENT_DURATION = 4;
const KEEP_LOCAL_TIME = true;

interface IFormCreateEvent {
	readonly company: UUID;
	readonly location: UUID;
	readonly start: string;
	readonly startTime: string;
	readonly max_slots: number | null;
	readonly plan_duration: number | null;
	readonly isMax_slots: boolean;
	readonly isPlan_duration: boolean;
}

export const CalendarPage = () => {
	const [
		isDisableCreateEventSubmitButton,
		setIsDisableCreateEventSubmitButton,
	] = useState(false);
	const [showSwitch, setShowSwitch] = useState(false);
	const [openDraw, setOpenDraw] = useState(false);
	const [isDisableCreateEventButton, setIsDisableCreateEventButton] =
		useState(false);
	const [companyList, setCompanyList] = useState<IApiCompany[]>([]);
	const [locationList, setLocationList] = useState<IApiLocation[]>([]);

	const tz = useStore($tz);
	const mastery = useStore($mastery);
	const profile = useStore($profile);

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

	const addDataEventToCalendar = (
		dateStart: string,
		dateEnd: string,
		calendar: CalendarApp,
	) => {
		const dateStartWithTz = dayjs(dateStart).tz(tz, KEEP_LOCAL_TIME).format();
		const dateEndWithTz = dayjs(dateEnd).tz(tz, KEEP_LOCAL_TIME).format();
		readEventsList(dateStartWithTz, dateEndWithTz, {
			imamaster: $mastery.get(),
		}).then((res) => {
			if (res !== null) {
				calendar.events.set(
					res.payload.map((apiEv) => {
						const start = dayjs(apiEv.date);
						const end = start.add(
							apiEv.plan_duration || DEFAULT_EVENT_DURATION,
							"h",
						);

						return {
							id: apiEv.id,
							title: apiEv.company,
							location: apiEv.location,
							people: apiEv.players,
							start: start.format(EVENT_FORMAT),
							end: end.format(EVENT_FORMAT),
						};
					}),
				);
			}
		});
	};

	const calendar = useCalendarApp({
		locale: "ru-RU",
		views: [createViewMonthGrid()],
		callbacks: {
			onEventClick(event) {
				navigate(`/event/${event.id}`);
			},
			onRangeUpdate(range) {
				addDataEventToCalendar(range.start, range.end, calendar);
			},
		},
	});

	useEffect(() => {
		const app = calendar["$app"] as CalendarAppSingleton;
		const range = app.calendarState.range.value;
		if (range !== null) {
			addDataEventToCalendar(range.start, range.end, calendar);
		}
	}, [mastery]);

	const getCompanies = () => {
		return readMyCompanies().then((responce) => {
			if (responce?.payload) {
				setCompanyList(responce.payload);
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

	const getNewEvent = (id: UUID) => {
		readEvent(id).then((responce) => {
			if (responce?.payload) {
				const data = responce.payload;
				const start = dayjs(data.date);
				const end = start.add(
					data.plan_duration || DEFAULT_EVENT_DURATION,
					"h",
				);

				calendar.events.add({
					...data,
					title: data.company,
					start: start.format(EVENT_FORMAT),
					end: end.format(EVENT_FORMAT),
				});
			}
		});
	};

	const companies = useMemo(() => {
		return createListCollection({
			items: companyList || [],
			itemToString: (item) => item.name,
			itemToValue: (item) => item.id,
		});
	}, [companyList]);

	const locations = useMemo(() => {
		return createListCollection({
			items: locationList || [],
			itemToString: (item) => item.name,
			itemToValue: (item) => item.id,
		});
	}, [locationList]);

	useEffect(() => {
		setShowSwitch(Boolean(profile?.signed));

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setOpenDraw(false);
			}
		};

		document.addEventListener("keydown", handleKeyDown, { passive: true });

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			setOpenDraw(false);
		};
	}, [profile?.signed]);

	const [isStart] = watch(["start"]);

	const validateDate = (value: string) => {
		clearErrors("startTime");
		const fieldDate = dayjs(value).tz(tz, KEEP_LOCAL_TIME);
		const nowDate = dayjs().tz(tz, KEEP_LOCAL_TIME);
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
		const fultime = dayjs(`${isStart} ${value}`).tz(tz, KEEP_LOCAL_TIME);
		const nowDate = dayjs().tz(tz, KEEP_LOCAL_TIME);
		if (
			nowDate.isSame(fultime, "minute") ||
			fultime.isAfter(nowDate, "minute")
		) {
			return true;
		} else {
			return "Вы указали прошлое время";
		}
	};

	const isMaxSlotsChecked = watch("isMax_slots");
	const isMaxDuration = watch("isPlan_duration");

	useEffect(() => {
		if (isMaxSlotsChecked) {
			setValue("max_slots", null); // Обнуляем значение
		}
		if (isMaxDuration) {
			setValue("plan_duration", null); // Обнуляем значение
		}
	}, [isMaxSlotsChecked, isMaxDuration, setValue]);

	const onSubmit = handleSubmit((data) => {
		const { company, location, start, startTime, max_slots, plan_duration } =
			data;

		if (data) {
			const date = dayjs(`${start}T${startTime}`).tz(tz, KEEP_LOCAL_TIME);
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
						setOpenDraw(false);
						getNewEvent(res.payload);
						reset();
					}
				})
				.finally(() => {
					setIsDisableCreateEventSubmitButton(false);
				});
		}
	});

	return (
		<section>
			<Container>
				<HStack flexWrap="wrap" mb="5" minHeight="40px" gap={10}>
					{!profile?.email_verified && profile?.signed && (
						<HoverCard content="Нельзя перейти в режим мастера - электронная почта не подтверждена">
							<Warning />
						</HoverCard>
					)}
					{showSwitch && (
						<Switch.Root
							size="lg"
							checked={mastery && profile?.email_verified}
							disabled={!profile?.email_verified}
							onCheckedChange={() =>
								mastery ? disableMastery() : enableMastery()
							}
						>
							<Switch.HiddenInput />
							<Switch.Control>
								<Switch.Thumb />
							</Switch.Control>
							<Switch.Label>Режим мастера</Switch.Label>
						</Switch.Root>
					)}

					{mastery && profile?.email_verified && showSwitch && (
						<Stack direction="row" gap={4}>
							<DrawerRoot
								open={openDraw}
								onOpenChange={(e) => {
									if (e.open) {
										setIsDisableCreateEventButton(true);
										Promise.all([
											getCompanies(),
											getLocations(),
										]).then(([companiesResult, locationsResult]) => {
											if (
												companiesResult === null ||
												locationsResult === null
											) {
												setIsDisableCreateEventButton(false);
												return;
											}
											setOpenDraw(e.open);
											setIsDisableCreateEventButton(false);
										});
									} else {
										setOpenDraw(e.open);
									}
								}}
							>
								<DrawerBackdrop />
								<DrawerTrigger asChild>
									<Button
										disabled={isDisableCreateEventButton}
										variant="outline"
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
														rules={{
															required: "Выберите кампанию",
														}}
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
																	disabled={
																		companies.items.length < 1
																	}
																/>
																<AutoCompleteList bg="inherit">
																	<AutoCompleteGroup>
																		{companies.items.map(
																			(option) => (
																				<AutoCompleteItem
																					key={option.id}
																					value={{
																						title: option.id,
																					}}
																					label={
																						option.name
																					}
																					textTransform="capitalize"
																					_hover={{
																						bg: "gray.200",
																					}}
																				/>
																			),
																		)}
																	</AutoCompleteGroup>
																</AutoCompleteList>
															</AutoComplete>
														)}
													/>
												</Field>

												<HStack
													alignItems="start"
													gap={2}
													width="full"
												>
													<Field
														label="Начало"
														errorText={errors.start?.message}
														invalid={!!errors.start?.message}
													>
														<Input
															type="date"
															min={dayjs()
																.tz(tz, KEEP_LOCAL_TIME)
																.format("YYYY-MM-DD")}
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
														rules={{
															required: "Выберите локацию",
														}}
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
																	disabled={
																		locations.items.length < 1
																	}
																/>
																<AutoCompleteList bg="inherit">
																	<AutoCompleteGroup>
																		{locations.items.map(
																			(option) => (
																				<AutoCompleteItem
																					key={option.id}
																					value={{
																						title: option.id,
																					}}
																					label={
																						option.name
																					}
																					textTransform="capitalize"
																					_hover={{
																						bg: "gray.200",
																					}}
																				/>
																			),
																		)}
																	</AutoCompleteGroup>
																</AutoCompleteList>
															</AutoComplete>
														)}
													/>
												</Field>

												<Card.Root>
													<CardBody padding={2}>
														<Field
															label="Максимальное количество игроков"
															errorText={
																errors.max_slots?.message
															}
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
																		if (
																			!isMaxSlotsChecked &&
																			!value
																		) {
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
																	onCheckedChange={({
																		checked,
																	}) =>
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
															errorText={
																errors.plan_duration?.message
															}
															invalid={
																!!errors.plan_duration
																	?.message && !isMaxDuration
															}
														>
															<Group attached w="full">
																<Input
																	type="number"
																	placeholder="Заполните поле"
																	min="1"
																	step="1"
																	disabled={isMaxDuration}
																	{...register(
																		"plan_duration",
																		{
																			validate: (value) => {
																				if (
																					!isMaxDuration &&
																					!value
																				) {
																					return "Укажите продолжительность";
																				}
																				return true;
																			},
																		},
																	)}
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
																	onCheckedChange={({
																		checked,
																	}) =>
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
							<Company data={companyList} />
							<Location />
						</Stack>
					)}
				</HStack>
				<ScheduleXCalendar calendarApp={calendar} />
			</Container>
		</section>
	);
};
