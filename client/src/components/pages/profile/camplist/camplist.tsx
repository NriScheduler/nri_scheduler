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
} from "@chakra-ui/react";
import { useStore } from "@nanostores/preact";

import { IApiCompany } from "../../../../api";
import {
	$checkboxState,
	toggleCheckbox,
} from "../../../../store/checkboxStore";

interface ICampList {
	readonly list: ReadonlyArray<IApiCompany>;
}

interface ICampItem {
	item: IApiCompany;
}

const CampItem = ({ item }: ICampItem) => {
	return (
		<Link
			href={`/company/${item.id}`}
			display="block"
			transition="all 0.2s"
			borderRadius="md"
			_hover={{
				textDecoration: "none",
				userSelect: "none",
				shadow: "md",
			}}
		>
			<Card.Root>
				<Card.Header>
					<Heading>{item.name}</Heading>
				</Card.Header>
				<Card.Body gap="2">
					<Card.Description>{item.description}</Card.Description>
				</Card.Body>
			</Card.Root>
		</Link>
	);
};

export const CampList = ({ list }: ICampList) => {
	const isChecked = useStore($checkboxState);

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

			{list.map((item) => (
				<Grid
					templateColumns={`repeat(${isChecked ? 4 : 1}, 1fr)`}
					gap="4"
					key={item.id}
				>
					<CampItem item={item} />
				</Grid>
			))}
		</Stack>
	);
};
