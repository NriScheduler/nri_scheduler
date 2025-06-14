import { h } from "preact";

import {
	Card,
	Grid,
	Heading,
	HStack,
	Link,
	Spinner,
	Stack,
	useBreakpointValue,
} from "@chakra-ui/react";

import { EmptyList } from "../empty-list";
import { getGridColumnsConfig, PROFILE_TEXTS } from "../profile.data";
import { ViewToggle } from "../../../view-toggle";
import { IApiCompany } from "../../../../api";

interface ICompList {
	readonly list: ReadonlyArray<IApiCompany>;
	isChecked: boolean;
	isLoading: boolean;
	toggleCheckbox: () => void;
}

interface ICompItem {
	readonly item: IApiCompany;
}

const CompItem = ({ item }: ICompItem) => {
	return (
		<Link
			href={`/company/${item.id}`}
			display="block"
			h="full"
			transition="all 0.2s"
			borderRadius="md"
			_hover={{
				textDecoration: "none",
				userSelect: "none",
				shadow: "md",
			}}
		>
			<Card.Root h="full">
				<Card.Header>
					<Heading>{item.name}</Heading>
				</Card.Header>
				<Card.Body gap="2">
					<Card.Description lineClamp="4">
						{item.description}
					</Card.Description>
				</Card.Body>
			</Card.Root>
		</Link>
	);
};

export const CompList = ({
	list,
	isChecked,
	toggleCheckbox,
	isLoading,
}: ICompList) => {
	const gridColumns = useBreakpointValue(getGridColumnsConfig(isChecked));

	return (
		<Stack>
			<HStack justify="flex-end">
				<ViewToggle isChecked={isChecked} toggleCheckbox={toggleCheckbox} />
			</HStack>

			{isLoading ? (
				<Spinner size="sm" />
			) : list.length > 0 ? (
				<Grid templateColumns={`repeat(${gridColumns}, 1fr)`} gap="4">
					{list.map((item) => (
						<CompItem key={item.id} item={item} />
					))}
				</Grid>
			) : (
				<EmptyList title={PROFILE_TEXTS.emptyStates.companies.title} />
			)}
		</Stack>
	);
};
