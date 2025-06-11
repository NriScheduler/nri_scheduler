import type { UUID } from "node:crypto";

import { h } from "preact";

import { HStack, Stack, Switch } from "@chakra-ui/react";

import { EmptyList } from "../empty-list";
import { PROFILE_TEXTS } from "../profile.data";
import { EventItem } from "../../../event-item";
import { GridLayout } from "../../../grid-layout";
import { ViewToggle } from "../../../view-toggle";
import { IMasterApp, IPlayerApp } from "../../../../api";

interface EventListProps {
	isChecked: boolean;
	layoutMode: boolean;
	onLayoutToggle: () => void;
	toggleCheckbox: () => void;
	playerAppList: IPlayerApp[];
	masterAppList: IMasterApp[];
	onUpdate?: () => Promise<void>;
}

export interface EventItemProps {
	item: IPlayerApp | IMasterApp;
	isMasterView: boolean;
	onReject?: (eventId: UUID) => void;
	onApprove?: (eventId: UUID) => void;
	onUpdate?: () => void;
}

function isMasterApp(item: IPlayerApp | IMasterApp): item is IMasterApp {
	return "player_name" in item;
}

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
				<GridLayout gridColumns={4} layoutMode={layoutMode}>
					{currentList.map((item) => (
						<EventItem
							item={item}
							key={item.id}
							isMaster={isMasterApp(item)}
							onUpdate={onUpdate}
						/>
					))}
				</GridLayout>
			)}
		</Stack>
	);
};
