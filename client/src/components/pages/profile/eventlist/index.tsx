import type { UUID } from "node:crypto";

import { Fragment, h } from "preact";

import {
	Badge,
	Button,
	Card,
	Grid,
	Heading,
	HStack,
	Stack,
	Switch,
	useBreakpointValue,
} from "@chakra-ui/react";
import dayjs from "dayjs";

import { EmptyList } from "../empty-list";
import { getGridColumnsConfig, PROFILE_TEXTS } from "../profile.data";
import { DialogItem } from "../../../dialog";
import { toaster } from "../../../ui/toaster";
import { ViewToggle } from "../../../view-toggle";
import {
	approveApplication,
	IMasterApp,
	IPlayerApp,
	rejectApplication,
} from "../../../../api";

interface EventListProps {
	isChecked: boolean;
	layoutMode: boolean;
	onLayoutToggle: () => void;
	toggleCheckbox: () => void;
	playerAppList: IPlayerApp[];
	masterAppList: IMasterApp[];
	onUpdate?: () => Promise<void>;
}

interface EventItemProps {
	item: IPlayerApp | IMasterApp;
	isMasterView: boolean;
	onReject?: (eventId: UUID) => void;
	onApprove?: (eventId: UUID) => void;
}

function isMasterApp(item: IPlayerApp | IMasterApp): item is IMasterApp {
	return "player_name" in item;
}

const EventItem = ({
	item,
	isMasterView,
	onReject,
	onApprove,
}: EventItemProps) => {
	const isMaster = isMasterApp(item);

	return (
		<Fragment>
			<DialogItem
				item={item}
				trigger={
					<Card.Root h="full" cursor="pointer" _hover={{ shadow: "md" }}>
						<Card.Header>
							{isMasterView ? (
								<Heading>
									Игрок{" "}
									<Badge fontSize="inherit" variant="surface">
										{isMaster ? item.player_name : item.master_name}
									</Badge>{" "}
									хочет присоединиться к вашей игре по кампании{" "}
									<Badge fontSize="inherit" variant="surface">
										{item.company_name}
									</Badge>
								</Heading>
							) : (
								<Heading>
									Вы подали заявку на участие в игре по кампании{" "}
									<Badge fontSize="inherit" variant="surface">
										{item.company_name}
									</Badge>{" "}
									мастера{" "}
									<Badge fontSize="inherit" variant="surface">
										{isMaster ? item.player_name : item.master_name}
									</Badge>
								</Heading>
							)}
						</Card.Header>
						<Card.Body gap="2">
							<Card.Description lineClamp={4}>
								{dayjs(item.event_date).format("D MMMM YYYY")}
							</Card.Description>
						</Card.Body>
					</Card.Root>
				}
				footer={
					isMasterView && (
						<Fragment>
							<Button
								variant="outline"
								onClick={() => onReject?.(item.id)}
								disabled={item.approval === false}
							>
								{item.approval ? "Отклонить" : "Отклонено"}
							</Button>
							<Button
								onClick={() => onApprove?.(item.id)}
								disabled={item.approval === true}
							>
								{item.approval ? "Подтверждено" : "Подтвердить"}
							</Button>
						</Fragment>
					)
				}
			/>
		</Fragment>
	);
};

export const EventList = ({
	isChecked,
	toggleCheckbox,
	layoutMode,
	onLayoutToggle,
	playerAppList,
	masterAppList,
	onUpdate,
}: EventListProps) => {
	const currentList = isChecked ? playerAppList : masterAppList;
	const isEmpty = currentList.length === 0;
	const emptyTexts = isChecked
		? PROFILE_TEXTS.emptyStates.player
		: PROFILE_TEXTS.emptyStates.master;

	const handleApprove = async (eventId: UUID) => {
		const result = await approveApplication(eventId);
		if (result !== null && result !== undefined) {
			toaster.success({ title: "Заявка подтверждена" });
			await onUpdate?.();
		}
	};

	const handleReject = async (eventId: UUID) => {
		const result = await rejectApplication(eventId);
		if (result !== null && result !== undefined) {
			toaster.success({ title: "Заявка отклонена" });
			await onUpdate?.();
		}
	};

	const gridColumns = useBreakpointValue(getGridColumnsConfig(layoutMode));

	return (
		<Stack>
			<HStack justify="flex-end" gap={4}>
				<Switch.Root checked={isChecked} onCheckedChange={toggleCheckbox}>
					<Switch.HiddenInput />
					<Switch.Label>
						{isChecked
							? PROFILE_TEXTS.switchLabels.master
							: PROFILE_TEXTS.switchLabels.player}
					</Switch.Label>
					<Switch.Control />
				</Switch.Root>
				<ViewToggle
					isChecked={layoutMode}
					toggleCheckbox={onLayoutToggle}
				/>
			</HStack>

			{isEmpty ? (
				<EmptyList
					title={emptyTexts.title}
					description={emptyTexts.description}
				/>
			) : (
				<Grid templateColumns={`repeat(${gridColumns}, 1fr)`} gap="4">
					{currentList.map((item) => (
						<EventItem
							key={item.id}
							item={item}
							isMasterView={!isChecked}
							onReject={handleReject}
							onApprove={handleApprove}
						/>
					))}
				</Grid>
			)}
		</Stack>
	);
};
