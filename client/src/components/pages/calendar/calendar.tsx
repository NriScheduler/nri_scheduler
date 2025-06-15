import "@schedule-x/theme-default/dist/index.css";
import "./calendar.css";

import type { UUID } from "node:crypto";

import { h } from "preact";
import { lazy, Suspense } from "preact/compat";
import { useEffect, useState } from "preact/hooks";
import { route as navigate } from "preact-router";

import { Container, HStack, Skeleton, Stack, Switch } from "@chakra-ui/react";
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

import { CalendarFilter } from "./calendar-filter";
import { HoverCard } from "../../ui/hover-card";
import { Warning } from "../../ui/icons";
import { IEventsFilter, readEvent, readEventsList } from "../../../api";
import {
	$mastery,
	disableMastery,
	enableMastery,
} from "../../../store/mastery";
import { $profile } from "../../../store/profile";
import { loadSharedData } from "../../../store/sharedDataStore";
import {
	convertEventStyleToCalendarType,
	escapeCalendarId,
	useEventTime,
} from "../../../utils";

const Company = lazy(() => import("./company"));
const Location = lazy(() => import("./location"));
const Event = lazy(() => import("./event"));
const skeleton = <Skeleton alignSelf="100%" w="30%" />;

const DEFAULT_EVENT_DURATION = 4;

export const CalendarPage = () => {
	const mastery = useStore($mastery);
	const profile = useStore($profile);

	const [showSwitch, setShowSwitch] = useState(false);
	const [openDrawers, setOpenDrawers] = useState({
		event: false,
		company: false,
		location: false,
		filter: false,
	});

	const { tz, EVENT_FORMAT, parseWithTz, formatEvent } = useEventTime();

	const addDataEventToCalendar = (
		dateStart: string,
		dateEnd: string,
		calendar: CalendarApp,
		filters?: IEventsFilter,
	) => {
		const dateStartWithTz = parseWithTz(dateStart).format();
		const dateEndWithTz = dayjs.tz(dateEnd, EVENT_FORMAT, tz).format();
		readEventsList(
			dateStartWithTz,
			dateEndWithTz,
			filters ?? {
				imamaster: $mastery.get(),
			},
		).then((res) => {
			if (res !== null) {
				calendar.events.set(res.payload.map((apiEv) => formatEvent(apiEv)));
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

	const applyFilters = (filters: IEventsFilter) => {
		const app = calendar["$app"] as CalendarAppSingleton;
		const range = app.calendarState.range.value;
		if (range !== null) {
			addDataEventToCalendar(range.start, range.end, calendar, filters);
		}
	};

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
				calendar.events.add(formatEvent(data));

				toggleDrawer("event", false);
			}
		});
	};

	const toggleDrawer = (drawerName: string, isOpen: boolean) => {
		setOpenDrawers((prev) => ({ ...prev, [drawerName]: isOpen }));
	};

	useEffect(() => {
		const app = calendar["$app"] as CalendarAppSingleton;
		const range = app.calendarState.range.value;
		if (range !== null) {
			addDataEventToCalendar(range.start, range.end, calendar);
		}
	}, [mastery]);

	useEffect(() => {
		setShowSwitch(Boolean(profile?.signed));
	}, [profile?.signed]);

	useEffect(() => {
		const loadData = async () => {
			await loadSharedData();
		};

		loadData();
	}, []);

	return (
		<section>
			<Container>
				<HStack flexWrap="wrap" mb="5" minHeight="40px" gap={10}>
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
						<Stack direction="row" gap={4}>
							<Suspense fallback={skeleton}>
								<Event
									isOpen={openDrawers.event}
									closeDrawer={() => toggleDrawer("event", false)}
									openDrawer={() => toggleDrawer("event", true)}
									getNewEvent={getNewEvent}
									profileRegion={profile.region}
									profileCity={profile.city}
								/>
							</Suspense>
							<Suspense fallback={skeleton}>
								<Company
									isOpen={openDrawers.company}
									closeDrawer={() => toggleDrawer("company", false)}
									openDrawer={() => toggleDrawer("company", true)}
								/>
							</Suspense>
							<Suspense fallback={skeleton}>
								<Location
									isOpen={openDrawers.location}
									closeDrawer={() => toggleDrawer("location", false)}
									openDrawer={() => toggleDrawer("location", true)}
								/>
							</Suspense>
						</Stack>
					)}

					<Stack ml="auto">
						<CalendarFilter
							isOpen={openDrawers.filter}
							closeDrawer={() => toggleDrawer("filter", false)}
							openDrawer={() => toggleDrawer("filter", true)}
							applyFilters={applyFilters}
							isMaster={mastery}
						/>
					</Stack>
				</HStack>
				<ScheduleXCalendar calendarApp={calendar} />
			</Container>
		</section>
	);
};

export default CalendarPage;
