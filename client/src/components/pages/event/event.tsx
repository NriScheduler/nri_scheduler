import type { UUID } from "node:crypto";

import { h, Fragment } from "preact";
import { useEffect, useState } from "preact/hooks";
import { useRouter } from "preact-router";
import { useStore } from "@nanostores/preact";

import dayjs from "dayjs";
import "dayjs/locale/ru";

import {
	Button,
	Card,
	Container,
	DataList,
	Heading,
	HStack,
	Link,
} from "@chakra-ui/react";
import { $tz } from "../../../store/tz";
import { applyEvent, getMinUser, IApiEvent, readEvent } from "../../../api";

dayjs.locale("ru");

const EventCard = ({ event }: { event: IApiEvent }) => {
	const tz = useStore($tz);

	const eventDate = dayjs(event.date).tz(tz);
	const customDay = eventDate.format("DD MMMM");

	const checkArray = (data: any) => {
		if (Array.isArray(data)) {
			if (data.length !== 0) {
				const dataString = data.join(", ");
				return <p>{dataString}</p>;
			} else {
				return <p>Пока никто не записался</p>;
			}
		} else {
			return <p>Пока никто не записался</p>;
		}
	};

	const stats = [
		{ label: "Мастер игры", value: event.master, href: "#" },
		{ label: "Место проведения", value: event.location, href: "#" },
		{ label: "Дата", value: customDay },
		{ label: "Время", value: eventDate.format("HH:mm") },
		{ label: "Всего игроков", value: event.max_slots || 0 },
		{ label: "Записаны", value: checkArray(event.players) },
		{ label: "Продолжительность", value: event.plan_duration || 0 },
	];

	const handleSubscribe = async () => {
		getMinUser().then((res) => {
			if (!res) return;
			console.log(res.payload.id)
			applyEvent(res.payload.id).then((responce) => {
				console.log(responce);
			});
		});
	};

	return (
		<>
			<Card.Root width="full">
				<Card.Body>
					<HStack mb="6" gap="3">
						<Heading size="3xl">{event.company}</Heading>
					</HStack>
					<Card.Description>
						<DataList.Root orientation="horizontal">
							{stats.map((item) => (
								<DataList.Item key={item.label}>
									<DataList.ItemLabel minW="150px">
										{item.label}
									</DataList.ItemLabel>
									<DataList.ItemValue color="black" fontWeight="500">
										{item.href ? (
											<Link href={item.href} colorPalette="blue">
												{item.value}
											</Link>
										) : (
											<p>{item.value}</p>
										)}
									</DataList.ItemValue>
								</DataList.Item>
							))}
						</DataList.Root>
					</Card.Description>
				</Card.Body>
				<Card.Footer>
					<Button
						variant="subtle"
						colorPalette="blue"
						onClick={handleSubscribe}
					>
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
