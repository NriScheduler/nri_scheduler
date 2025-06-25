import "@schedule-x/theme-default/dist/index.css";
import "./calendar.css";

import type { UUID } from "node:crypto";

import { h } from "preact";
import { lazy, Suspense } from "preact/compat";
import { useEffect, useState } from "preact/hooks";
import { route as navigate } from "preact-router";

import {
	Box,
	Container,
	Flex,
	HStack,
	Skeleton,
	Switch,
} from "@chakra-ui/react";
import { useStore } from "@nanostores/preact";
import {
	CalendarApp,
	CalendarEventExternal,
	CalendarType,
	createViewMonthGrid,
} from "@schedule-x/calendar";
import { ScheduleXCalendar, useCalendarApp } from "@schedule-x/preact";
import { CalendarAppSingleton } from "@schedule-x/shared";
import dayjs from "dayjs";

import { HoverCard } from "../../ui/hover-card";
import { Warning } from "../../ui/icons";
import { IApiCompany, readEvent, readEventsList } from "../../../api";
import {
	$mastery,
	disableMastery,
	enableMastery,
} from "../../../store/mastery";
import { $profile, $tz } from "../../../store/profile";
import {
	convertEventStyleToCalendarType,
	escapeCalendarId,
	EVENT_FORMAT,
} from "../../../utils";

const Company = lazy(() => import("./company"));
const Location = lazy(() => import("./location"));
const Event = lazy(() => import("./event"));
const skeleton = <Skeleton alignSelf="100%" w="30%" />;

const DEFAULT_EVENT_DURATION = 4;

export const CalendarPage = () => {
	const [showSwitch, setShowSwitch] = useState(false);
	const [openDraw, setOpenDraw] = useState(false);
	const [companyList, setCompanyList] = useState<ReadonlyArray<IApiCompany>>(
		[],
	);

	const tz = useStore($tz);
	const mastery = useStore($mastery);
	const profile = useStore($profile);

	const addDataEventToCalendar = (
		dateStart: string,
		dateEnd: string,
		calendar: CalendarApp,
	) => {
		const dateStartWithTz = dayjs.tz(dateStart, EVENT_FORMAT, tz).format();
		const dateEndWithTz = dayjs.tz(dateEnd, EVENT_FORMAT, tz).format();
		readEventsList(dateStartWithTz, dateEndWithTz, {
			imamaster: $mastery.get(),
		}).then((res) => {
			if (res !== null) {
				const calendars: Record<string, CalendarType> = {};

				const events = res.payload.map((apiEv) => {
					const start = dayjs(apiEv.date).tz(tz);
					let end = start.add(
						apiEv.plan_duration || DEFAULT_EVENT_DURATION,
						"h",
					);

					if (!end.isSame(start, "day")) {
						end = start.endOf("day");
					}

					const event: CalendarEventExternal = {
						id: apiEv.id,
						title: apiEv.company,
						start: start.format(EVENT_FORMAT),
						end: end.format(EVENT_FORMAT),
					};

					const style = apiEv.style;
					if (style) {
						const calendarId = escapeCalendarId(style);
						calendars[calendarId] =
							convertEventStyleToCalendarType(style);
						event.calendarId = calendarId;
					}

					return event;
				});

				const app = calendar["$app"] as CalendarAppSingleton;
				app.config.calendars.value = calendars;
				app.config.theme = "master";

				calendar.events.set(events);
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

	const getNewEvent = (id: UUID) => {
		readEvent(id).then((responce) => {
			if (responce?.payload) {
				const data = responce.payload;
				const start = dayjs(data.date).tz(tz);
				let end = start.add(
					data.plan_duration || DEFAULT_EVENT_DURATION,
					"h",
				);

				if (!end.isSame(start, "day")) {
					end = start.endOf("day");
				}

				calendar.events.add({
					...data,
					title: data.company,
					start: start.format(EVENT_FORMAT),
					end: end.format(EVENT_FORMAT),
				});
			}
		});
	};

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

	return (
		<section className={"calendar-page"}>
			<Container h={"full"} pb={"6"}>
				<Flex gap="4" direction="column" h={"full"}>
					<HStack
						flexDirection={{ base: "column", md: "row" }}
						minH={"40px"}
						gap={4}
						justifyContent={"space-between"}
					>
						{!profile?.verified && profile?.signed && (
							<HoverCard content="Нельзя перейти в режим мастера - контактные данные не подтверждены">
								<Warning />
							</HoverCard>
						)}
						{showSwitch && (
							<Switch.Root
								size="lg"
								checked={mastery && profile?.verified}
								disabled={!profile?.verified}
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

						{mastery && profile?.verified && showSwitch && (
							<HStack
								gap={4}
								// flexDirection={{ base: "column", sm: "row" }}
							>
								<Suspense fallback={skeleton}>
									<Company data={companyList} />
								</Suspense>
								<Suspense fallback={skeleton}>
									<Location />
								</Suspense>
								<Suspense fallback={skeleton}>
									<Event
										openDraw={openDraw}
										setOpenDraw={setOpenDraw}
										companyList={companyList}
										setCompanyList={setCompanyList}
										tz={tz}
										getNewEvent={getNewEvent}
										profileRegion={profile.region}
										profileCity={profile.city}
									/>
								</Suspense>
							</HStack>
						)}
					</HStack>

					<Box
						p={2}
						background={mastery ? "#18181b" : "#e4e4e7"}
						transition={"background 0.2s ease-in-out"}
						borderRadius={"lg"}
						h={"full"}
					>
						<ScheduleXCalendar calendarApp={calendar} />
					</Box>
				</Flex>
			</Container>
		</section>
	);
};

export default CalendarPage;
