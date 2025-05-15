import { h } from "preact";
import React from "preact/compat";

import { Badge, Button, DataList, Dialog, Portal } from "@chakra-ui/react";
import "dayjs/locale/ru";
import dayjs from "dayjs";

import { CloseButton } from "./ui/close-button";
import { IMasterApp, IPlayerApp } from "../api";

dayjs.locale("ru");

type AppItem = IPlayerApp | IMasterApp;

interface IDialogItem {
	item: AppItem;
	children?: React.ReactNode;
}

export const DialogItem = ({ item, children }: IDialogItem) => {
	const dataItems = [
		{
			label: "Дата и время",
			value: dayjs(item.event_date).format("D MMMM YYYY, HH:mm"),
		},
		{
			label: "Локация",
			value: item.location_name,
		},
		{
			label: "Игрок",
			value: "player_name" in item ? item.player_name : item.master_name,
		},
		{
			label: "Статус",
			value: item.event_cancelled ? (
				<Badge colorPalette="red">Запись закрыта</Badge>
			) : (
				<Badge colorPalette="green">Запись открыта</Badge>
			),
		},
	];

	return (
		<Dialog.Root>
			<Dialog.Trigger asChild>
				<Button
					variant="outline"
					size="sm"
					aria-label="Подробнее о событии"
					w="fit-content"
				>
					Подробнее о событии
				</Button>
			</Dialog.Trigger>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<Dialog.Content>
						<Dialog.Header>
							<Dialog.Title>
								Игра по кампании {item.company_name}
							</Dialog.Title>
						</Dialog.Header>
						<Dialog.Body>
							<DataList.Root orientation="horizontal">
								{dataItems.map((dataItem, index) => (
									<DataList.Item key={index}>
										<DataList.ItemLabel>
											{dataItem.label}
										</DataList.ItemLabel>
										<DataList.ItemValue>
											{dataItem.value}
										</DataList.ItemValue>
									</DataList.Item>
								))}
							</DataList.Root>
						</Dialog.Body>
						<Dialog.Footer gap={2}>{children}</Dialog.Footer>
						<Dialog.CloseTrigger asChild>
							<CloseButton size="sm" />
						</Dialog.CloseTrigger>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};
