import type { UUID } from "node:crypto";

import { Fragment, h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { useRouter } from "preact-router";
import { useForm } from "react-hook-form";

import {
	Button,
	Card,
	Container,
	createListCollection,
	DataList,
	Dialog,
	Group,
	Heading,
	HStack,
	Image,
	Input,
	InputAddon,
	Link,
	NativeSelect,
	Portal,
	Skeleton,
	Stack,
	Text,
} from "@chakra-ui/react";
import { useStore } from "@nanostores/preact";
import dayjs from "dayjs";

import { NotFoundPage } from "../not-found/not-found";
import { CloseButton } from "../../ui/close-button";
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
	applyEvent,
	cancelEvent,
	EScenarioStatus,
	IApiEvent,
	IApiLocation,
	readEvent,
	readLocations,
	reopenEvent,
	updateEvent,
} from "../../../api";
import { $profile, $tz } from "../../../store/profile";
import {
	calcMapIconLink,
	EVENT_FORMAT,
	navBack,
	YYYY_MM_DD,
} from "../../../utils";

const EventCard = ({
	event,
	updateEventData,
}: {
	event: IApiEvent;
	updateEventData: () => void;
}) => {
	const tz = useStore($tz);
	const profile = useStore($profile);

	const eventDate = dayjs(event.date).tz(tz);

	const [isLoading, setIsLoading] = useState(false);
	const [youApplied, setYouApplied] = useState(event.you_applied);

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
			value: event.max_slots
				? `${event.players.length} из ${event.max_slots}`
				: "Без ограничений",
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
		setIsLoading(true);
		applyEvent(event.id)
			.then((responce) => {
				if (responce?.status === EScenarioStatus.SCENARIO_SUCCESS) {
					setYouApplied(true);
					toaster.success({ title: "Успех. Запись оформлена" });
				}
			})
			.finally(() => {
				setIsLoading(false);
			});
	};
	const nowDate = dayjs().tz(tz);

	const onCancelEvent = () => {
		cancelEvent(event.id).then(() => {
			toaster.success({ title: "Событие отменено" });
			updateEventData();
		});
	};

	const onReopenEvent = () => {
		reopenEvent(event.id).then(() => {
			toaster.success({ title: "Событие открыто" });
			updateEventData();
		});
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
			<Card.Footer>
				{profile?.signed ? (
					!event.you_are_master &&
					(nowDate.isSame(eventDate, "minute") ||
						eventDate.isAfter(nowDate, "minute")) &&
					!event.cancelled ? (
						<>
							<Button
								variant="subtle"
								colorPalette="blue"
								minW="115px"
								onClick={handleSubscribe}
								disabled={isLoading || youApplied || !profile.verified}
							>
								{isLoading
									? "..."
									: youApplied
										? "Вы записаны"
										: "Записаться"}
							</Button>
							{!profile.verified && (
								<HoverCard content="Нельзя записаться на событие - контактные данные не подтверждены">
									<Warning />
								</HoverCard>
							)}
						</>
					) : null
				) : (
					!event.cancelled &&
					"необходимо авторизоваться для записи на игру"
				)}
				{eventDate.isBefore(nowDate, "minute") && (
					<>
						<HoverCard content="Запись закрыта потому что событие уже стартовало">
							<Warning />
						</HoverCard>
						<Text>Запись закрыта</Text>
					</>
				)}
				{event.cancelled && (
					<>
						<HoverCard content="Запись закрыта потому что мастер отменил событие">
							<Warning />
						</HoverCard>
						<Text>Запись закрыта мастером</Text>
					</>
				)}
				{event.you_are_master && !event.cancelled && (
					<Dialog.Root role="alertdialog" placement="center">
						<Dialog.Trigger asChild>
							<Button
								type="button"
								variant="subtle"
								colorPalette="blue"
								minW="115px"
							>
								Отменить событие
							</Button>
						</Dialog.Trigger>
						<Portal>
							<Dialog.Backdrop />
							<Dialog.Positioner>
								<Dialog.Content>
									<Dialog.Header>
										<Dialog.Title>А вы уверены?</Dialog.Title>
									</Dialog.Header>
									<Dialog.Footer>
										<Dialog.ActionTrigger asChild>
											<Button variant="outline">Нет</Button>
										</Dialog.ActionTrigger>
										<Button
											colorPalette="red"
											onClick={onCancelEvent}
										>
											Да
										</Button>
									</Dialog.Footer>
									<Dialog.CloseTrigger asChild>
										<CloseButton size="sm" />
									</Dialog.CloseTrigger>
								</Dialog.Content>
							</Dialog.Positioner>
						</Portal>
					</Dialog.Root>
				)}
				{event.you_are_master && event.cancelled && (
					<Button
						onClick={onReopenEvent}
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

interface IFormEditEvent {
	readonly company: UUID;
	readonly location: UUID;
	readonly start: string;
	readonly startTime: string;
	readonly max_slots: string;
	readonly plan_duration: string;
}

export const EventPage = () => {
	const [route] = useRouter();
	const eventId = route.matches?.id as UUID | undefined;
	const [fetching, setFetching] = useState(false);
	const [event, setEvent] = useState<IApiEvent | null>(null);
	const [open, setOpen] = useState(false);
	const [locationList, setLocationList] = useState<
		ReadonlyArray<IApiLocation>
	>([]);
	const [isDisableEditEventSubmitButton, setIsDisableEditEventSubmitButton] =
		useState(false);
	const tz = useStore($tz);

	const getLocations = () => {
		return readLocations().then((responce) => {
			if (responce?.payload) {
				setLocationList(responce.payload);
			}
			return responce?.payload || null;
		});
	};

	const locations = useMemo(() => {
		return createListCollection({
			items: locationList,
			itemToString: (item) => item.name,
			itemToValue: (item) => item.id,
		});
	}, [locationList]);
	const {
		register,
		handleSubmit,
		watch,
		clearErrors,
		formState: { errors },
	} = useForm<IFormEditEvent>();
	const onSubmit = handleSubmit((data) => {
		const { location, start, startTime, max_slots, plan_duration } = data;

		if (data) {
			const date = dayjs.tz(`${start} ${startTime}`, EVENT_FORMAT, tz);
			setIsDisableEditEventSubmitButton(true);
			if (!eventId) {
				return;
			}
			updateEvent(
				eventId,
				date.toISOString(),
				location,
				Number(max_slots) || null,
				Number(plan_duration) || null,
			)
				.then((res) => {
					if (res !== null) {
						setOpen(false);
					}
				})
				.then(() =>
					readEvent(eventId).then((res) => {
						if (res !== null) {
							setEvent(res.payload);
							return res?.payload;
						}
					}),
				)
				.finally(() => {
					setIsDisableEditEventSubmitButton(false);
				});
		}
	});
	const [start] = watch(["start"]);
	const validateDate = (value: string) => {
		clearErrors("startTime");
		const fieldDate = dayjs.tz(`${value} 12:00`, EVENT_FORMAT, tz);
		const nowDate = dayjs().tz(tz);
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
		if (!start) {
			return "Укажите дату";
		}
		const fultime = dayjs.tz(`${start} ${value}`, EVENT_FORMAT, tz);
		const nowDate = dayjs().tz(tz);
		if (
			nowDate.isSame(fultime, "minute") ||
			fultime.isAfter(nowDate, "minute")
		) {
			return true;
		} else {
			return "Вы указали прошлое время";
		}
	};
	useEffect(() => {
		if (eventId) {
			setFetching(true);
			readEvent(eventId)
				.then((res) => {
					if (res !== null) {
						setEvent(res.payload);
						return res?.payload;
					}
				})
				.then((eventData) => {
					if (eventData?.you_are_master) {
						return getLocations();
					}
				})
				.finally(() => {
					setFetching(false);
				});
		}
	}, [route.matches?.id]);

	const eventDate = dayjs(event?.date).tz(tz);

	const updateEventData = () => {
		if (eventId) {
			setFetching(true);
			readEvent(eventId)
				.then((res) => {
					if (res !== null) {
						setEvent(res.payload);
						return res?.payload;
					}
				})
				.then((eventData) => {
					if (eventData?.you_are_master) {
						return getLocations();
					}
				})
				.finally(() => {
					setFetching(false);
				});
		}
	};

	return (
		<section>
			<Container>
				<Button mb={4} onClick={navBack}>
					Вернуться назад
				</Button>
				{event?.you_are_master && (
					<HStack alignItems="top">
						<DrawerRoot
							open={open}
							onOpenChange={(e) => {
								setOpen(e.open);
							}}
						>
							<DrawerBackdrop />
							<DrawerTrigger asChild>
								<Button
									colorPalette="cyan"
									mt="4"
									mb="4"
									variant="solid"
								>
									Редактировать событие
								</Button>
							</DrawerTrigger>
							<DrawerContent>
								<DrawerHeader>
									<DrawerTitle>Редактирование события</DrawerTitle>
								</DrawerHeader>
								<DrawerBody>
									<form onSubmit={onSubmit}>
										<Stack gap="4" w="full">
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
														defaultValue={eventDate.format(
															YYYY_MM_DD,
														)}
														min={dayjs()
															.tz(tz)
															.format(YYYY_MM_DD)}
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
														defaultValue={eventDate.format(
															"HH:mm",
														)}
														{...register("startTime", {
															required: "Заполните поле",
															validate: validateTime,
														})}
													/>
												</Field>
											</HStack>
											<Field
												label="Локация"
												errorText={errors.location?.message}
												invalid={!!errors.location?.message}
											>
												<NativeSelect.Root>
													<NativeSelect.Field
														placeholder="Выберите из списка"
														{...register("location", {
															required: "Заполните",
														})}
														defaultValue={event.location_id}
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
													defaultValue={event?.max_slots || 0}
													{...register("max_slots")}
												/>
											</Field>

											<Field label="Планируемая длительность">
												<Group attached w="full">
													<Input
														type="number"
														min="1"
														step="1"
														defaultValue={
															event?.plan_duration || 0
														}
														{...register("plan_duration")}
													/>
													<InputAddon>час</InputAddon>
												</Group>
											</Field>
										</Stack>
										<Button
											disabled={isDisableEditEventSubmitButton}
											type="submit"
											w="full"
											mt={6}
										>
											Редактировать
										</Button>
										<DrawerTrigger asChild>
											<Button type="button" w="full" mt={6}>
												Отмена
											</Button>
										</DrawerTrigger>
									</form>
								</DrawerBody>
								<DrawerCloseTrigger />
							</DrawerContent>
						</DrawerRoot>
					</HStack>
				)}
				{fetching ? (
					<EventCardSkeleton />
				) : event !== null ? (
					<EventCard event={event} updateEventData={updateEventData} />
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
