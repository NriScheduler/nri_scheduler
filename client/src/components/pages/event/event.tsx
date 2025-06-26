import { UUID } from "node:crypto";

import { Fragment, h } from "preact";
import { useEffect } from "preact/hooks";
import { useRouter } from "preact-router";

import {
	Button,
	Card,
	Container,
	DataList,
	Heading,
	HStack,
	Image,
	Link,
	Skeleton,
} from "@chakra-ui/react";
import { useStore } from "@nanostores/preact";
import dayjs from "dayjs";

import { EditEventDrawer } from "./edit-event";
import { EventAlert } from "./event-alert";
import { EventDialog } from "./event-dialog";
import { NotFoundPage } from "../not-found/not-found";
import { IApiEvent } from "../../../api";
import {
	$event,
	$isEventMaster,
	applyToEvent,
	cancelEventAction,
	fetchEvent,
	reopenEventAction,
} from "../../../store/event";
import { $profile, $tz } from "../../../store/profile";
import { calcMapIconLink, navBack } from "../../../utils";

interface IEventCardProps {
	event: IApiEvent;
	isLoading: boolean;
	isApplied: boolean;
}

const EventCard = ({ event, isLoading, isApplied }: IEventCardProps) => {
	const tz = useStore($tz);
	const profile = useStore($profile);

	const eventDate = dayjs(event.date).tz(tz);
	const nowDate = dayjs().tz(tz);

	const isEventFull =
		event.max_slots !== null && event.players.length >= event.max_slots;

	const stats = [
		{
			label: "Мастер игры",
			value: event.master,
			href: `/profile/${event.master_id}`,
		},
		{
			label: "Место проведения",
			value: event.location,
			href: `/location/${event.location_id}`,
			mapLink: event.location_map_link,
		},
		{ label: "Дата", value: eventDate.format("DD MMMM") },
		{ label: "Время", value: eventDate.format("HH:mm") },
		{
			label: "Количество игроков",
			value:
				event.max_slots === null
					? "Без ограничений"
					: isEventFull
						? "Свободных мест нет"
						: `${event.players.length} из ${event.max_slots}`,
		},
		{
			label: "Записаны",
			value: event?.players?.length ? (
				<>
					{event.players.map(([userId, nickname], i) => (
						<>
							<Link
								key={userId}
								href={`/profile/${userId}`}
								colorPalette="blue"
							>
								{nickname}
							</Link>
							{i !== event.players.length - 1 ? ", " : ""}
						</>
					))}
				</>
			) : (
				"Пока никто не записался"
			),
		},
		{
			label: "Продолжительность",
			value: event.plan_duration
				? `${event.plan_duration} ч`
				: "Не строим планов",
		},
	];

	const handleSubscribe = () => {
		if (event.id) {
			applyToEvent(event.id);
		}
	};

	return (
		<Card.Root width="full">
			<Card.Body>
				<HStack mb="6" gap="3">
					<Heading size="3xl">
						Игра по кампании:&nbsp;
						<Link
							colorPalette="cyan"
							variant="underline"
							href={`/company/${event.company_id}`}
						>
							{event.company}
						</Link>
					</Heading>
				</HStack>
				<DataList.Root orientation="horizontal">
					{stats.map((item) => {
						const iconLink = calcMapIconLink(item.mapLink);

						return (
							<DataList.Item key={item.label}>
								<DataList.ItemLabel minW="150px">
									{item.label}
								</DataList.ItemLabel>
								<DataList.ItemValue color="black" fontWeight="500">
									{item.href ? (
										<HStack>
											<Link href={item.href} colorPalette="blue">
												{item.value}
											</Link>
											{iconLink && (
												<a
													target="_blank"
													href={item.mapLink as string}
													rel="noreferrer"
												>
													<Image
														height="1.75rem"
														src={iconLink}
														alt="Показать локацию на карте"
													/>
												</a>
											)}
										</HStack>
									) : (
										<p>{item.value}</p>
									)}
								</DataList.ItemValue>
							</DataList.Item>
						);
					})}
				</DataList.Root>
			</Card.Body>
			<Card.Footer
				// flexDirection={"column"}
				alignItems={"center"}
				gap={4}
			>
				{profile?.signed ? (
					!event.you_are_master &&
					(nowDate.isSame(eventDate, "minute") ||
						eventDate.isAfter(nowDate, "minute")) &&
					!event.cancelled ? (
						<>
							{isEventFull && !isApplied && (
								<>
									<EventAlert
										title="Свободных мест нет"
										description="ваша заявка будет рассмотрена отдельно мастером игры"
										status="warning"
									/>
									<EventDialog
										title="Мест нет, но можно подать заявку"
										description="К сожалению, свободные места на это событие закончились. Вы всё ещё можете отправить заявку, но она не будет подтверждена автоматически — мастер рассмотрит её отдельно"
										buttonTitle="Записаться"
										handleClick={handleSubscribe}
									/>
								</>
							)}

							{!isEventFull && (
								<Button
									variant="subtle"
									colorPalette="blue"
									minW="115px"
									onClick={handleSubscribe}
									disabled={
										isLoading || isApplied || !profile.verified
									}
								>
									{isLoading
										? "..."
										: isApplied
											? "Вы записаны"
											: "Записаться"}
								</Button>
							)}

							{isApplied && isEventFull && (
								<Button
									variant="subtle"
									colorPalette="blue"
									minW="115px"
									disabled
								>
									В ожидании
								</Button>
							)}

							{!profile.verified && (
								<EventAlert
									title="Нельзя записаться на событие"
									description="контактные данные не подтверждены"
									status="error"
								/>
							)}
						</>
					) : null
				) : (
					!event.cancelled && (
						<EventAlert
							title="Внимание"
							description="необходимо авторизоваться для записи на игру"
							status="warning"
						/>
					)
				)}
				{eventDate.isBefore(nowDate, "minute") && (
					<EventAlert
						title="Запись закрыта"
						description="событие уже стартовало"
						status="neutral"
					/>
				)}
				{event.cancelled && (
					<EventAlert
						title="Запись закрыта"
						description="мастер отменил событие"
						status="neutral"
					/>
				)}
				{event.you_are_master && !event.cancelled && (
					<EventDialog
						title="А вы уверены?"
						buttonTitle="Отменить событие"
						handleClick={() => cancelEventAction(event.id)}
					/>
				)}
				{event.you_are_master && event.cancelled && (
					<Button
						onClick={() => reopenEventAction(event.id)}
						variant="subtle"
						colorPalette="blue"
						minW="115px"
					>
						Переоткрыть событие
					</Button>
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
			</Card.Body>
		</Card.Root>
	);
};

export const EventPage = () => {
	const [route] = useRouter();
	const eventId = route.matches?.id as UUID | undefined;
	const event = useStore($event);
	const isEventLoading = event.loading;
	const isLoading = event.subscribing;
	const isApplied = event.applied;
	const isMaster = useStore($isEventMaster);

	useEffect(() => {
		if (eventId) {
			fetchEvent(eventId);
		}
	}, [eventId]);

	return (
		<section>
			<Container>
				<HStack gap={2} mb={4}>
					<Button onClick={navBack}>Вернуться назад</Button>
					{isMaster && (
						<EditEventDrawer
							renderButton={
								<Button
									colorPalette="cyan"
									mt="4"
									mb="4"
									variant="solid"
								>
									Редактировать событие
								</Button>
							}
						/>
					)}
				</HStack>
				{isEventLoading ? (
					<EventCardSkeleton />
				) : event.data !== null ? (
					<EventCard
						event={event.data}
						isLoading={isLoading}
						isApplied={isApplied}
					/>
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
