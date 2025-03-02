import type { UUID } from "node:crypto";

import { h } from "preact"; // eslint-disable-line
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
	Skeleton,
} from "@chakra-ui/react";
import { $tz } from "../../../store/tz";
import {
	applyEvent,
	EScenarioStatus,
	IApiEvent,
	readEvent,
} from "../../../api";
import toast from "react-hot-toast";
import { $signed } from "../../../store/profile";
import { NotFoundPage } from "../not-found/not-found";

dayjs.locale("ru");

const EventCard = ({ event }: { event: IApiEvent }) => {
	const tz = useStore($tz);
	const signed = useStore($signed);

	const counterPlayers = !event.max_slots
		? "Без ограничений"
		: `${event.players.length} из ${event.max_slots}`;

	const planDuration = !event.plan_duration
		? "Не строим планов"
		: `${event.plan_duration} ч`;

	const eventDate = dayjs(event.date).tz(tz);
	const customDay = eventDate.format("DD MMMM");
	const [buttonMsg, setButtonMsg] = useState(
		event.you_applied ? "Вы записаны" : "Записаться"
	);
	const [isLoading, setIsLoading] = useState(false);

	const checkArray = (data: string[]) => {
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
		{ label: "Количество игроков", value: counterPlayers },
		{ label: "Записаны", value: checkArray(event.players) },
		{ label: "Продолжительность", value: planDuration },
	];

	const handleSubscribe = () => {
		setIsLoading(true);
		setButtonMsg("...");
		applyEvent(event.id)
			.then((responce) => {
				if (responce?.status === EScenarioStatus.SCENARIO_SUCCESS) {
					setButtonMsg("Вы записаны");
					toast.success("Успех. Запись оформлена");
				}
			})
			.finally(() => {
				setIsLoading(false);
			});
	};

	return (
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
					{signed ? (
						!event.you_are_master ? (
							<Button
								variant="subtle"
								colorPalette="blue"
								minW="115px"
								onClick={handleSubscribe}
								disabled={isLoading || event.you_applied}
							>
								{buttonMsg}
							</Button>
						) : null
					) : (
						"необходимо авторизоваться для записи на игру"
					)}
				</Card.Footer>
			</Card.Root>
	);
};

const EventCardSkeleton = () => {
	const stats = [
		{ label: "Мастер игры" },
		{ label: "Место проведения" },
		{ label: "Дата" },
		{ label: "Время" },
		{ label: "Количество игроков" },
		{ label: "Записаны" },
		{ label: "Продолжительность" },
	];

	return (
			<Card.Root width="full">
				<Card.Body>
					<HStack mb="6" gap="3">
						<Skeleton height="38px" w="30%" />
					</HStack>
					<Card.Description>
						<DataList.Root orientation="horizontal">
							{stats.map((item, index) => (
								<DataList.Item key={index}>
									<DataList.ItemLabel minW="150px">
										{item.label}
									</DataList.ItemLabel>
									<DataList.ItemValue color="black" fontWeight="500">
										<Skeleton height="20px" w="30%" />
									</DataList.ItemValue>
								</DataList.Item>
							))}
						</DataList.Root>
					</Card.Description>
				</Card.Body>
			</Card.Root>
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
					<EventCardSkeleton />
				) : event !== null ? (
					<EventCard event={event} />
				) : (
					<NotFoundPage
						checkButton={false}
						title="Событие не найдено, попробуйте еще раз!"
					/>
				)}
			</Container>
		</section>
	);
};
