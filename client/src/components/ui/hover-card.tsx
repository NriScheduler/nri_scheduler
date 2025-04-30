import { ReactNode } from "react";

import { HoverCard as HCard } from "@chakra-ui/react";

export interface IHoverCardProps {
	readonly children: ReactNode | string;
	readonly content: ReactNode | string;
}

export const HoverCard = ({ children, content }: IHoverCardProps) => (
	<HCard.Root>
		<HCard.Trigger cursor="help">{children}</HCard.Trigger>
		<HCard.Positioner>
			<HCard.Content>
				<HCard.Arrow />
				{content}
			</HCard.Content>
		</HCard.Positioner>
	</HCard.Root>
);
