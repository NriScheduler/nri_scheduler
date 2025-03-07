import type { UUID } from "node:crypto";

import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { useRouter } from "preact-router";
import toast from "react-hot-toast";

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
import { useStore } from "@nanostores/preact";
import "dayjs/locale/ru";
import dayjs from "dayjs";

import { NotFoundPage } from "../not-found/not-found";
import {
	applyEvent,
	EScenarioStatus,
	IApiEvent,
	readEvent,
} from "../../../api";
import { $signed } from "../../../store/profile";
import { $tz } from "../../../store/tz";

dayjs.locale("ru");

const EventCard = ({ event }: { event: IApiEvent }) => {
	const tz = useStore($tz);
	const signed = useStore($signed);

	const eventDate = dayjs(event.date).tz(tz);

	const [isLoading, setIsLoading] = useState(false);
	const [youApplied, setYouApplied] = useState(event.you_applied);

	const stats = [
		{ label: "Мастер игры", value: event.master, href: "#" },
		{ label: "Место проведения", value: event.location, href: "#" },
		{ label: "Дата", value: eventDate.format("DD MMMM") },
		{ label: "Время", value: eventDate.format("HH:mm") },
		{
			label: "Количество игроков",
			value: event.max_slots
				? `${event.players.length} из ${event.max_slots}`
				: "Без ограничений",
		},
		{
			label: "Записаны",
			value: event?.players?.length
				? event.players.join(", ")
				: "Пока никто не записался",
		},
		{
			label: "Продолжительность",
			value: event.plan_duration
				? `${event.plan_duration} ч`
				: "Не строим планов",
		},
	];

	const handleSubscribe = () => {
		setIsLoading(true);
		applyEvent(event.id)
			.then((responce) => {
				if (responce?.status === EScenarioStatus.SCENARIO_SUCCESS) {
					setYouApplied(true);
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
					<Heading size="3xl">
						Игра по компании:&nbsp;
						<Link href={`/company/${event.company_id}`}>
							{event.company}
						</Link>
					</Heading>
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
							disabled={isLoading || youApplied}
						>
							{isLoading
								? "..."
								: youApplied
									? "Вы записаны"
									: "Записаться"}
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
