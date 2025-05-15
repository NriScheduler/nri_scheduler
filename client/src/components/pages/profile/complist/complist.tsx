import { h } from "preact";
import { FaBars, FaBorderAll } from "react-icons/fa";

import {
	Card,
	Grid,
	Heading,
	Icon,
	Link,
	Stack,
	Switch,
	Text,
	useBreakpointValue,
} from "@chakra-ui/react";

import { IApiCompany } from "../../../../api";

interface ICompList {
	readonly list: ReadonlyArray<IApiCompany>;
	isChecked: boolean;
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

export const CompList = ({ list, isChecked, toggleCheckbox }: ICompList) => {
	// Адаптивные значения
	const gridColumns = useBreakpointValue({
		base: isChecked ? 2 : 1,
		sm: isChecked ? 2 : 1,
		md: isChecked ? 3 : 1,
		lg: isChecked ? 4 : 1,
		xl: isChecked ? 4 : 1,
	});

	return (
		<Stack>
			<Switch.Root
				colorPalette="cyan"
				size="lg"
				mb={6}
				ml="auto"
				display="block"
				checked={isChecked}
				onCheckedChange={toggleCheckbox}
			>
				<Switch.HiddenInput />
				<Switch.Control>
					<Switch.Thumb />
					<Switch.Indicator fallback={<Icon as={FaBars} />}>
						<Icon as={FaBorderAll} color="white" />
					</Switch.Indicator>
				</Switch.Control>
			</Switch.Root>

			<Grid templateColumns={`repeat(${gridColumns}, 1fr)`} gap="4">
				{list.map((item) => (
					<CompItem key={item.id} item={item} />
				))}
			</Grid>
		</Stack>
	);
};
