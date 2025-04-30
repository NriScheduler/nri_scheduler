import { ReactNode } from "react";

import { Popover as ChakraPopover } from "@chakra-ui/react";
import type { PositioningOptions } from "@zag-js/popper";

export interface IPopoverProps {
	readonly children: ReactNode | string;
	readonly content: ReactNode | string;
	readonly positioning?: PositioningOptions;
	readonly open?: boolean;
	readonly onOpenChange?: (evt: { open: boolean }) => void;
}

export const Popover = (p: IPopoverProps) => (
	<ChakraPopover.Root
		open={p.open}
		onOpenChange={p.onOpenChange}
		positioning={p.positioning}
	>
		<ChakraPopover.Trigger asChild cursor="pointer">
			{p.children}
		</ChakraPopover.Trigger>
		<ChakraPopover.Positioner>
			<ChakraPopover.Content>
				<ChakraPopover.Arrow>
					<ChakraPopover.ArrowTip />
				</ChakraPopover.Arrow>
				<ChakraPopover.Body>{p.content}</ChakraPopover.Body>
			</ChakraPopover.Content>
		</ChakraPopover.Positioner>
	</ChakraPopover.Root>
);
