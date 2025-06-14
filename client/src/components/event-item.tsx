import { UUID } from "node:crypto";

import { Fragment, h } from "preact";

import { Button, Card } from "@chakra-ui/react";

import { DialogItem } from "./dialog";
import { toaster } from "./ui/toaster";
import {
	approveApplication,
	IMasterApp,
	IPlayerApp,
	rejectApplication,
} from "../api";

interface IEventItemProps {
	item: IPlayerApp | IMasterApp;
	isMaster?: boolean;
	onUpdate?: () => void;
}

export const EventItem = ({ item, isMaster, onUpdate }: IEventItemProps) => {
	const handleApprove = async (eventId: UUID) => {
		const result = await approveApplication(eventId);
		if (result !== null && result !== undefined) {
			toaster.success({ title: "Заявка подтверждена" });
			onUpdate?.();
		}
	};

	const handleReject = async (eventId: UUID) => {
		const result = await rejectApplication(eventId);
		if (result !== null && result !== undefined) {
			toaster.success({ title: "Заявка отклонена" });
			onUpdate?.();
		}
	};

	const renderFooter = () => {
		if (!isMaster) {
			return null;
		}

		return (
			<Fragment>
				<Button
					variant="outline"
					onClick={() => handleReject(item.id)}
					disabled={item.approval === false}
				>
					{item.approval ? "Отклонить" : "Отклонено"}
				</Button>
				<Button
					onClick={() => handleApprove(item.id)}
					disabled={item.approval === true}
				>
					{item.approval ? "Подтверждено" : "Подтвердить"}
				</Button>
			</Fragment>
		);
	};

	return (
		<Card.Root key={item.id}>
			<Card.Body>
				<Card.Title>
					{isMaster ? `Игрок ${item.player_name}` : "Ваша заявка"}
				</Card.Title>
				<Card.Description>
					{isMaster
						? "хочет присоединиться к вашей игре по кампании."
						: `подана заявка на участие в игре ${item.company_name}`}
				</Card.Description>
			</Card.Body>
			<Card.Footer>
				<DialogItem
					item={item}
					trigger={
						<Button variant="surface" flex="1">
							Детали
						</Button>
					}
					footer={renderFooter()}
				/>
			</Card.Footer>
		</Card.Root>
	);
};
