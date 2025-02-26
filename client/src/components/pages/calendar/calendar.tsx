import "@schedule-x/theme-default/dist/index.css";
import "./calendar.css";

import dayjs from "dayjs";

import { useCalendarApp, ScheduleXCalendar } from "@schedule-x/preact";
import { createViewMonthGrid } from "@schedule-x/calendar";

import { h } from "preact";
import { useEffect } from "preact/hooks";
import { route as navigate } from "preact-router";
import { useStore } from "@nanostores/preact";

import { readEventsList } from "../../../api";
import { $tz } from "../../../store/tz";
import { Container } from "@chakra-ui/react";

const EVENT_FORMAT = "YYYY-MM-DD HH:mm";
const DEFAULT_EVENT_DURATION = 4;

export const CalendarPage = () => {
	const tz = useStore($tz);

	const calendar = useCalendarApp({
		locale: "ru-RU",
		views: [createViewMonthGrid()],
		callbacks: {
			onEventClick(event) {
				navigate(`/event/${event.id}`);
			},
		},
	});

	useEffect(() => {
		const now = dayjs().tz(tz);
		const monthStart = now.startOf("M").format();
		const monthEnd = now.endOf("M").format();

		/** @todo передавать таймзону, возвращать в нужной таймзоне, присылать название кампании, локации, список людей */
		readEventsList(monthStart, monthEnd).then((res) => {
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
	}, []);

	return (
		<section>
			<Container>
				<ScheduleXCalendar calendarApp={calendar} />
			</Container>
		</section>
	);
};
