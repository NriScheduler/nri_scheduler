import { UUID } from "node:crypto";

import { h } from "preact";
import { ReactNode } from "preact/compat";
import { useMemo, useState } from "preact/hooks";
import { useRouter } from "preact-router";
import { useForm } from "react-hook-form";

import {
	Button,
	Group,
	HStack,
	Input,
	InputAddon,
	NativeSelect,
	Stack,
} from "@chakra-ui/react";
import { useStore } from "@nanostores/preact";
import dayjs from "dayjs";

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
import { $event, updateEventAction } from "../../../store/event";
import { $locations } from "../../../store/locations";
import { $tz } from "../../../store/profile";
import { EVENT_FORMAT, YYYY_MM_DD } from "../../../utils";

interface IFormEditEvent {
	readonly company: UUID;
	readonly location: UUID;
	readonly start: string;
	readonly startTime: string;
	readonly max_slots: string;
	readonly plan_duration: string;
}

interface IEditEventDrawerProps {
	renderButton: ReactNode;
}

interface ILocationOptionProps {
	value: string;
	label: string;
}

export const EditEventDrawer = ({ renderButton }: IEditEventDrawerProps) => {
	const [route] = useRouter();
	const eventId = route.matches?.id as UUID;
	const { data: event } = useStore($event);
	const tz = useStore($tz);
	const locations = useStore($locations);

	const [isOpen, setIsOpen] = useState(false);

	const eventDate = useMemo(
		() => dayjs(event?.date).tz(tz),
		[event?.date, tz],
	);

	const {
		register,
		handleSubmit,
		watch,
		clearErrors,
		formState: { errors, isSubmitting },
	} = useForm<IFormEditEvent>({
		defaultValues: {
			location: event?.location_id,
			start: eventDate.format(YYYY_MM_DD),
			startTime: eventDate.format("HH:mm"),
			max_slots: event?.max_slots?.toString() ?? "0",
			plan_duration: event?.plan_duration?.toString() ?? "0",
		},
	});

	const [startValue] = watch(["start"]);

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
		if (!startValue) {
			return "Укажите дату";
		}
		const fultime = dayjs.tz(`${startValue} ${value}`, EVENT_FORMAT, tz);
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

	const onSubmit = handleSubmit(async (data) => {
		if (!eventId) {
			return;
		}

		const { location, start, startTime, max_slots, plan_duration } = data;
		const date = dayjs.tz(`${start} ${startTime}`, EVENT_FORMAT, tz);

		await updateEventAction(
			eventId,
			date.toISOString(),
			location,
			Number(max_slots) || null,
			Number(plan_duration) || null,
		);

		setIsOpen(false);
	});

	const locationOptions: ILocationOptionProps[] = useMemo(() => {
		return locations.map(
			(loc): ILocationOptionProps => ({
				value: loc.id,
				label: loc.name,
			}),
		);
	}, [locations]);

	return (
		<DrawerRoot open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
			<DrawerBackdrop />
			<DrawerTrigger asChild>{renderButton}</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Редактирование события</DrawerTitle>
				</DrawerHeader>
				<DrawerBody>
					<form onSubmit={onSubmit}>
						<Stack gap="4" w="full">
							<HStack alignItems="start" gap={2} width="full">
								<Field
									label="Начало"
									errorText={errors.start?.message}
									invalid={!!errors.start?.message}
								>
									<Input
										type="date"
										min={dayjs().tz(tz).format(YYYY_MM_DD)}
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
											required: "Заполните поле",
										})}
									>
										{locationOptions.map((loc) => (
											<option value={loc.value} key={loc.value}>
												{loc.label}
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
									{...register("max_slots")}
								/>
							</Field>

							<Field label="Планируемая длительность">
								<Group attached w="full">
									<Input
										type="number"
										min="1"
										step="1"
										{...register("plan_duration")}
									/>
									<InputAddon>час</InputAddon>
								</Group>
							</Field>
						</Stack>
						<Button disabled={isSubmitting} type="submit" w="full" mt={6}>
							Редактировать
						</Button>
						<DrawerCloseTrigger asChild>
							<Button type="button" w="full" mt={6}>
								Отмена
							</Button>
						</DrawerCloseTrigger>
					</form>
				</DrawerBody>
				<DrawerCloseTrigger />
			</DrawerContent>
		</DrawerRoot>
	);
};
