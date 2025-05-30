import { Fragment, h } from "preact";
import { ReactNode, useEffect, useState } from "preact/compat";

import { Badge, DataList, Dialog, Link, Portal } from "@chakra-ui/react";
import dayjs from "dayjs";

import { CloseButton } from "./ui/close-button";
import { IMasterApp, IPlayerApp } from "../api";

type AppItem = IPlayerApp | IMasterApp;

interface IDialogItem {
	item: AppItem;
	trigger: ReactNode;
	footer?: ReactNode;
	title?: string;
	additionalData?: Array<{
		label: string;
		value: ReactNode;
		link?: string;
	}>;
}

export const DialogItem = ({
	item,
	trigger,
	footer,
	title = `Игра по кампании ${item.company_name}`,
	additionalData = [],
}: IDialogItem) => {
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsOpen(false);
			}
		};

		document.addEventListener("keydown", handleKeyDown, { passive: true });
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			setIsOpen(false);
		};
	}, []);

	// Базовые данные для отображения
	const baseDataItems = [
		{
			label: "Дата и время",
			value: (
				<Fragment>
					{dayjs(item.event_date).format("D MMMM YYYY, HH:mm")}
					<Badge
						colorPalette={item.event_cancelled ? "red" : "green"}
						ml={2}
					>
						{item.event_cancelled
							? "(Запись закрыта)"
							: "(Запись открыта)"}
					</Badge>
				</Fragment>
			),
		},
		{
			label: "Локация",
			value: item.location_name,
			link: `/location/${item.location_id}`,
		},
		{
			label: "player_name" in item ? "Игрок" : "Мастер",
			value: "player_name" in item ? item.player_name : item.master_name,
			link: `/profile/${"player_name" in item ? item.player_id : item.master_id}`,
		},
		{
			label: "Статус",
			value: getStatusBadge(item),
		},
		...additionalData, // Добавляем дополнительные данные
	];

	function getStatusBadge(application: AppItem) {
		if (application.event_cancelled) {
			return <Badge colorPalette="red">Событие отменено</Badge>;
		}
		if (application.approval === true) {
			return <Badge colorPalette="green">Заявка принята</Badge>;
		}
		if (application.approval === false) {
			return <Badge colorPalette="red">Заявка отклонена</Badge>;
		}
		return <Badge colorPalette="orange">Ожидает подтверждения</Badge>;
	}

	return (
		<Fragment>
			<Dialog.Root
				lazyMount
				open={isOpen}
				onOpenChange={({ open }) => setIsOpen(open)}
			>
				<Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
				<Portal>
					<Dialog.Backdrop />
					<Dialog.Positioner>
						<Dialog.Content>
							<Dialog.Header>
								<Dialog.Title>
									<Link
										href={`/company/${item.company_id}`}
										colorPalette="blue"
									>
										{title}
									</Link>
								</Dialog.Title>
							</Dialog.Header>
							<Dialog.Body>
								<DataList.Root orientation="horizontal">
									{baseDataItems.map((dataItem, index) => (
										<DataList.Item key={index}>
											<DataList.ItemLabel>
												{dataItem.label}
											</DataList.ItemLabel>
											<DataList.ItemValue>
												{dataItem.link ? (
													<Link
														href={dataItem.link}
														colorPalette="blue"
													>
														{dataItem.value}
													</Link>
												) : (
													dataItem.value
												)}
											</DataList.ItemValue>
										</DataList.Item>
									))}
								</DataList.Root>
							</Dialog.Body>
							{footer && <Dialog.Footer gap={2}>{footer}</Dialog.Footer>}
							<Dialog.CloseTrigger asChild>
								<CloseButton size="sm" />
							</Dialog.CloseTrigger>
						</Dialog.Content>
					</Dialog.Positioner>
				</Portal>
			</Dialog.Root>
		</Fragment>
	);
};
