import type { UUID } from "node:crypto";

import { Fragment, h } from "preact";

import { Badge, Button, Stack, Switch, Timeline } from "@chakra-ui/react";

import { EmptyList } from "../empty-list";
import { PROFILE_TEXTS } from "../profile.data";
import { DialogItem } from "../../../dialog";
import { toaster } from "../../../ui/toaster";
import {
	approveApplication,
	IMasterApp,
	IPlayerApp,
	rejectApplication,
} from "../../../../api";

interface EventListProps {
	isChecked: boolean;
	toggleCheckbox: () => void;
	playerAppList: IPlayerApp[];
	masterAppList: IMasterApp[];
	// onUpdate?: () => Promise<void>;
}

interface TimelineItemProps {
	item: IPlayerApp | IMasterApp;
	index: number;
	isMasterView: boolean;
	onReject?: (eventId: UUID) => void;
	onApprove?: (eventId: UUID) => void;
}

function isMasterApp(item: IPlayerApp | IMasterApp): item is IMasterApp {
	return "player_name" in item;
}

const TimelineItem = ({
	item,
	index,
	isMasterView,
	onReject,
	onApprove,
}: TimelineItemProps) => {
	const isMaster = isMasterApp(item);

	return (
		<Timeline.Item>
			<Timeline.Connector>
				<Timeline.Separator />
				<Timeline.Indicator>{index + 1}</Timeline.Indicator>
			</Timeline.Connector>
			<Timeline.Content>
				<Timeline.Title>
					{isMasterView ? (
						<Fragment>
							Игрок{" "}
							<Badge>
								{isMaster ? item.player_name : item.master_name}
							</Badge>{" "}
							хочет присоединиться к вашей игре{" "}
							<Badge>{item.company_name}</Badge>
						</Fragment>
					) : (
						<Fragment>
							Вы подали заявку на участие в игре{" "}
							<Badge>{item.company_name}</Badge>
						</Fragment>
					)}
				</Timeline.Title>
				<Timeline.Description></Timeline.Description>
				{isMasterView ? (
					<Fragment>
						<DialogItem item={item}>
							<Button
								variant="outline"
								onClick={() => onReject?.(item.id)}
								disabled={item.approval === false}
							>
								Отклонить
							</Button>
							<Button
								onClick={() => onApprove?.(item.id)}
								disabled={item.approval === true}
							>
								{item.approval ? "Подтверждено" : "Подтвердить"}
							</Button>
						</DialogItem>
					</Fragment>
				) : (
					<DialogItem item={item} />
				)}
			</Timeline.Content>
		</Timeline.Item>
	);
};
export const EventList = ({
	isChecked,
	toggleCheckbox,
	playerAppList,
	masterAppList,
	// onUpdate,
}: EventListProps) => {
	const currentList = isChecked ? playerAppList : masterAppList;
	const isEmpty = currentList.length === 0;
	const emptyTexts = isChecked
		? PROFILE_TEXTS.emptyStates.player
		: PROFILE_TEXTS.emptyStates.master;

	const handleApprove = async (eventId: UUID) => {
		await approveApplication(eventId);
		toaster.success({ title: "Заявка подтверждена" });
	};

	const handleReject = async (eventId: UUID) => {
		await rejectApplication(eventId);
		toaster.success({ title: "Заявка отклонена" });
	};

	return (
		<Stack>
			<Switch.Root
				ml="auto"
				checked={isChecked}
				onCheckedChange={toggleCheckbox}
			>
				<Switch.HiddenInput />
				<Switch.Label>
					{isChecked
						? PROFILE_TEXTS.switchLabels.master
						: PROFILE_TEXTS.switchLabels.player}
				</Switch.Label>
				<Switch.Control />
			</Switch.Root>

			{isEmpty ? (
				<EmptyList
					title={emptyTexts.title}
					description={emptyTexts.description}
				/>
			) : (
				<Timeline.Root variant="subtle" mt="8">
					{currentList.map((item, index) => (
						<TimelineItem
							key={index}
							item={item}
							index={index}
							isMasterView={!isChecked}
							onReject={handleReject}
							onApprove={handleApprove}
						/>
					))}
				</Timeline.Root>
			)}
		</Stack>
	);
};
