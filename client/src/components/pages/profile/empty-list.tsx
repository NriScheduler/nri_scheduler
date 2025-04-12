import { h } from "preact";
import { MdOutlineEvent } from "react-icons/md";

import { EmptyState, VStack } from "@chakra-ui/react";

interface IEmptyList {
	title: string;
	description?: string;
}

export const EmptyList = ({ title, description }: IEmptyList) => {
	return (
		<EmptyState.Root w="full">
			<EmptyState.Content>
				<EmptyState.Indicator>
					<MdOutlineEvent />
				</EmptyState.Indicator>
				<VStack textAlign="center">
					<EmptyState.Title>{title}</EmptyState.Title>
					<EmptyState.Description>{description}</EmptyState.Description>
				</VStack>
			</EmptyState.Content>
		</EmptyState.Root>
	);
};
