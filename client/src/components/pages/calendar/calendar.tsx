import { h } from "preact"; // eslint-disable-line

import "@schedule-x/theme-default/dist/index.css";
import "./calendar.css";

import dayjs from "dayjs";

import { useCalendarApp, ScheduleXCalendar } from "@schedule-x/preact";
import { createViewMonthGrid, CalendarApp } from "@schedule-x/calendar";

import { useEffect, useMemo, useState } from "preact/hooks";
import { route as navigate } from "preact-router";
import { useStore } from "@nanostores/preact";

import {
	createEvent,
	IApiCompany,
	IApiLocation,
	readEvent,
	readEventsList,
	readLocations,
	readMyCompanies,
} from "../../../api";
import { $tz } from "../../../store/tz";
import {
	Button,
	Container,
	createListCollection,
	Group,
	HStack,
	Input,
	InputAddon,
	NativeSelect,
	Stack,
} from "@chakra-ui/react";

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
import { useForm } from "react-hook-form";
import { Company } from "./company";
import { Location } from "./location";
import { UUID } from "crypto";
import toast from "react-hot-toast";

const EVENT_FORMAT = "YYYY-MM-DD HH:mm";
const DEFAULT_EVENT_DURATION = 4;
const KEEP_LOCAL_TIME = true;

interface IFormCreateEvent {
	readonly company: UUID;
	readonly location: UUID;
	readonly start: string;
	readonly startTime: string;
	readonly max_slots: string,
	readonly plan_duration: string,
}

export const CalendarPage = () => {
	const [openDraw, setOpenDraw] = useState(false);
	const [companyList, setCompanyList] = useState<IApiCompany[]>([]);
	const [locationList, setLocationList] = useState<IApiLocation[]>([]);

	const tz = useStore($tz);
	const { register, handleSubmit, reset } =
		useForm<IFormCreateEvent>();

	const addDataEventToCalendar = (dateStart: string, dateEnd: string, calendar: CalendarApp) => {
		const dateStartWithTz = dayjs(dateStart).tz(tz, KEEP_LOCAL_TIME).format();
		const dateEndWithTz = dayjs(dateEnd).tz(tz, KEEP_LOCAL_TIME).format();
		readEventsList(dateStartWithTz, dateEndWithTz).then((res) => {
			if (res !== null) {
				calendar.events.set(
					res.payload.map((apiEv) => {
						const start = dayjs(apiEv.date);
						const end = start.add(
							apiEv.plan_duration || DEFAULT_EVENT_DURATION,
							"h"
						);

						return {
							id: apiEv.id,
							title: apiEv.company,
							location: apiEv.location,
							people: apiEv.players,
							start: start.format(EVENT_FORMAT),
							end: end.format(EVENT_FORMAT),
						};
					})
				);
			}
		});
	}

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
			onRender(app) {
				const range = app.calendarState.range.value;
				if(range === null) {
					return
				};
				addDataEventToCalendar(range.start, range.end, calendar);
			}
		},
	});

	const getCompanies = () => {
		readMyCompanies().then((responce) => {
			if (responce?.payload) {
				setCompanyList(responce.payload);
			}
		});
	};

	const getLocations = () => {
		readLocations().then((responce) => {
			if (responce?.payload) {
				setLocationList(responce.payload);
			}
		});
	};

	const getNewEvent = (id: UUID) => {
		readEvent(id).then((responce) => {
			if (responce?.payload) {
				const data = responce.payload;
				const start = dayjs(data.date);
				const end = start.add(
					data.plan_duration || DEFAULT_EVENT_DURATION,
					"h"
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
			items: locationList,
			itemToString: (item) => item.name,
			itemToValue: (item) => item.id,
		});
	}, [locationList]);

	useEffect(() => {
		getCompanies();
		getLocations();

		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			setOpenDraw(false);
		};
	}, []);

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === "Escape") setOpenDraw(false);
	}

	const onSubmit = handleSubmit((data) => {
		const { company, location, start, startTime, max_slots, plan_duration } =
			data;

		if (data) {
			const date = dayjs(`${start}T${startTime}`).tz(tz, KEEP_LOCAL_TIME);

			createEvent(
				company,
				date.toISOString(),
				location,
				Number(max_slots) || null,
				Number(plan_duration) || null
			).then((res) => {
				if (res) {
					toast.success("Событие успешно создано");
					setOpenDraw(false);
					getNewEvent(res.payload);
					reset();
				}
			});
		}
	});

	return (
		<section>
			<Container>
				<Stack mb={4} direction="row" gap={4}>
					<DrawerRoot
						open={openDraw}
						onOpenChange={(e) => {
							if (e) {
								setOpenDraw(e.open);
							}
						}}
					>
						<DrawerBackdrop />
						<DrawerTrigger asChild>
							<Button variant="outline">Добавить событие</Button>
						</DrawerTrigger>
						<DrawerContent>
							<DrawerHeader>
								<DrawerTitle>Создание события</DrawerTitle>
							</DrawerHeader>
							<DrawerBody>
								<form onSubmit={onSubmit}>
									<Stack gap="4" w="full">
										<Field label="Кампания">
											<NativeSelect.Root>
												<NativeSelect.Field
													placeholder="Выберите из списка"
													{...register("company", {
														required: "Заполните",
													})}
													defaultValue={companyList?.[0]?.id}
												>
													{companies.items.map((company) => (
														<option
															value={company.id}
															key={company.name}
														>
															{company.name}
														</option>
													))}
												</NativeSelect.Field>
												<NativeSelect.Indicator />
											</NativeSelect.Root>
										</Field>
										<HStack gap={2} width="full">
											<Field label="Начало">
												<Input
													type="date"
													{...register("start", {
														required: "Заполните поле",
													})}
												/>
											</Field>
											<Field label="Время">
												<Input
													type="time"
													{...register("startTime", {
														required: "Заполните поле",
													})}
												/>
											</Field>
										</HStack>
										<Field label="Локация">
											<NativeSelect.Root>
												<NativeSelect.Field
													placeholder="Выберите из списка"
													{...register("location", {
														required: "Заполните",
													})}
													defaultValue={locationList?.[0]?.id}
												>
													{locations.items.map((location) => (
														<option
															value={location.id}
															key={location.name}
														>
															{location.name}
														</option>
													))}
												</NativeSelect.Field>
												<NativeSelect.Indicator />
											</NativeSelect.Root>
										</Field>

										<Field label="Максимальное количество игроков">
											<Input
												type="number"
												min="1"
												step="1"
												defaultValue="1"
												{...register("max_slots")}
											/>
										</Field>

										<Field label="Планируемая длительность">
											<Group attached w="full">
												<Input
													type="number"
													min="1"
													step="1"
													defaultValue="1"
													{...register("plan_duration")}
												/>
												<InputAddon>час</InputAddon>
											</Group>
										</Field>
									</Stack>
									<Button type="submit" w="full" mt={6}>
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
				<ScheduleXCalendar calendarApp={calendar} />
			</Container>
		</section>
	);
};
