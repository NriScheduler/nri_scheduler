import { h } from "preact";

import {
	Grid,
	HStack,
	Spinner,
	Stack,
	Switch,
	useBreakpointValue,
} from "@chakra-ui/react";
import { useStore } from "@nanostores/preact";

import { EmptyList } from "../empty-list";
import { getGridColumnsConfig, PROFILE_TEXTS } from "../profile.data";
import { EventItem } from "../../../event-item";
import { ViewToggle } from "../../../view-toggle";
import { $eventsStore } from "../../../../store/eventList";

interface EventListProps {
	isChecked: boolean;
	layoutMode: boolean;
	onLayoutToggle: () => void;
	toggleCheckbox: () => void;
}

export const EventList = ({
	isChecked,
	layoutMode,
	toggleCheckbox,
	onLayoutToggle,
}: EventListProps) => {
	const { list, isLoading, isMaster } = useStore($eventsStore);

	const emptyTexts = isChecked
		? PROFILE_TEXTS.emptyStates.player
		: PROFILE_TEXTS.emptyStates.master;

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

			{isLoading ? (
				<Spinner size="sm" />
			) : list.length > 0 ? (
				<Grid templateColumns={`repeat(${gridColumns}, 1fr)`} gap="4">
					{list.map((item) => (
						<EventItem item={item} key={item.id} isMaster={isMaster} />
					))}
				</Grid>
			) : (
				<EmptyList
					title={emptyTexts.title}
					description={emptyTexts.description}
				/>
			)}
		</Stack>
	);
};
