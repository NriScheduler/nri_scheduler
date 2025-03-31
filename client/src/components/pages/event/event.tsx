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
	Group,
	Heading,
	HStack,
	Input,
	InputAddon,
	Link,
	NativeSelect,
	Skeleton,
	Stack,
} from "@chakra-ui/react";
import { useStore } from "@nanostores/preact";
import "dayjs/locale/ru";
import dayjs from "dayjs";

import { NotFoundPage } from "../not-found/not-found";
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
	EScenarioStatus,
	IApiEvent,
	IApiLocation,
	readEvent,
	readLocations,
	updateEvent,
} from "../../../api";
import { $profile, $tz } from "../../../store/profile";
import { navBack } from "../../../utils";

dayjs.locale("ru");

const EventCard = ({ event }: { event: IApiEvent }) => {
	const tz = useStore($tz);
	const profile = useStore($profile);

	const eventDate = dayjs(event.date).tz(tz);

	const [isLoading, setIsLoading] = useState(false);
	const [youApplied, setYouApplied] = useState(event.you_applied);

	const stats = [
		{ label: "Мастер игры", value: event.master, href: "#" },
		{
			label: "Место проведения",
			value: event.location,
			href: `/location/${event.location_id}`,
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
					toaster.success({ title: "Успех. Запись оформлена" });
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
			</Card.Body>
			<Card.Footer>
				{profile?.signed ? (
					!event.you_are_master ? (
						<>
							<Button
								variant="subtle"
								colorPalette="blue"
								minW="115px"
								onClick={handleSubscribe}
								disabled={
									isLoading || youApplied || !profile.email_verified
								}
							>
								{isLoading
									? "..."
									: youApplied
										? "Вы записаны"
										: "Записаться"}
							</Button>
							{!profile.email_verified && (
								<HoverCard content="Нельзя записаться на событие - электронная почта не подтверждена">
									<Warning />
								</HoverCard>
							)}
						</>
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

const KEEP_LOCAL_TIME = true;

export const EventPage = () => {
	const [route] = useRouter();
	const eventId = route.matches?.id as UUID | undefined;
	const [fetching, setFetching] = useState(false);
	const [event, setEvent] = useState<IApiEvent | null>(null);
	const [open, setOpen] = useState(false);
	const [locationList, setLocationList] = useState<IApiLocation[]>([]);
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
			const date = dayjs(`${start}T${startTime}`).tz(tz, KEEP_LOCAL_TIME);
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
		const fieldDate = dayjs(value).tz(tz, KEEP_LOCAL_TIME);
		const nowDate = dayjs().tz(tz, KEEP_LOCAL_TIME);
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
		const fultime = dayjs(`${start} ${value}`).tz(tz, KEEP_LOCAL_TIME);
		const nowDate = dayjs().tz(tz, KEEP_LOCAL_TIME);
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
															"YYYY-MM-DD",
														)}
														min={dayjs()
															.tz(tz, KEEP_LOCAL_TIME)
															.format("YYYY-MM-DD")}
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
