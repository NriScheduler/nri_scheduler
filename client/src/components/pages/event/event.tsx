import type { UUID } from "node:crypto";

import { h, Fragment } from "preact";
import { useEffect, useState } from "preact/hooks";
import { useRouter } from "preact-router";
import { useStore } from "@nanostores/preact";

import dayjs from "dayjs";
import "dayjs/locale/ru";

import {
	Box,
	Button,
	Card,
	Container,
	Heading,
	HStack,
	Link,
	Stack,
	Strong,
	Text,
} from "@chakra-ui/react";
import { $tz } from "../../../store/tz";
import { IApiEvent, readEvent } from "../../../api";

dayjs.locale("ru");

const EventCard = ({ event }: { event: IApiEvent }) => {
	const tz = useStore($tz);

	const eventDate = dayjs(event.date).tz(tz);
	const customDay = eventDate.format("DD MMMM");

	return (
		<>
			<Card.Root width="full">
				<Card.Body>
					<HStack mb="6" gap="3">
						<Heading size="3xl">{event.company}</Heading>
					</HStack>
					<Card.Description>
						<Stack gap={4}>
							<Box display="flex" alignItems="center" gap={2}>
								<Strong color="fg">Мастер игры: </Strong>
								<Link href="#" variant="underline" colorPalette="blue">
									{event.master}
								</Link>
							</Box>
							<Box display="flex" alignItems="center" gap={2}>
								<Strong color="fg">Место проведения: </Strong>
								<Text>{event.location}</Text>
							</Box>
							<Box display="flex" alignItems="center" gap={2}>
								<Strong color="fg">Дата: </Strong>
								<Text>{customDay}</Text>
							</Box>
							<Box display="flex" alignItems="center" gap={2}>
								<Strong color="fg">Время: </Strong>
								<Text>{eventDate.format("HH:mm")}</Text>
							</Box>
							<Box display="flex" alignItems="center" gap={2}>
								<Strong color="fg">Всего игроков: </Strong>
								<Link href="#">{event.max_slots || 0}</Link>
							</Box>
							<Box display="flex" alignItems="center" gap={2}>
								<Box display="flex" alignItems="center" gap={2}>
									<Strong color="fg">Записаны: -</Strong>
									{event.players.map((item, index) => (
										<Link href="#" key={index} variant="underline" colorPalette="blue">
											{`Игрок ${index + 1}`}
										</Link>
									))}
								</Box>
							</Box>
							<Box display="flex" alignItems="center" gap={2}>
								<Strong color="fg">Продолжительность: </Strong>
								<Link href="#">{event.plan_duration || 0}</Link>
							</Box>
						</Stack>
					</Card.Description>
				</Card.Body>
				<Card.Footer>
					<Button variant="subtle" colorPalette="blue">
						{event.you_applied ? "Ожидание" : "Записаться"}
					</Button>
				</Card.Footer>
			</Card.Root>
		</>
	);
};

export const EventPage = () => {
	
	const [route] = useRouter();

	const [fetching, setFetching] = useState(false);
	const [event, setEvent] = useState<IApiEvent | null>(null);

	useEffect(() => {
		const eventId = route.matches?.id as UUID | undefined;
		if (eventId) {
			setFetching(true);
			readEvent(eventId)
				.then((res) => {
					if (res !== null) {
						setEvent(res.payload);
					}
				})
				.finally(() => {
					setFetching(false);
				});
		}
	}, [route.matches?.id]);

	function handleBackButton() {
		window.history.back();
	}

	return (
		<section>
			<Container>
				<Button mb={4} onClick={handleBackButton}>
					Вернуться назад
				</Button>
				{fetching ? (
					"Загрузка..."
				) : event !== null ? (
					<EventCard event={event} />
				) : (
					"Ошибка загрузки"
				)}
			</Container>
		</section>
	);
};
