import { h, RefObject } from "preact";
import { forwardRef } from "preact/compat";
import {
	Popover as ChakraPopover,
	CloseButton,
	Portal,
} from "@chakra-ui/react";

interface IPopoverContentProps extends ChakraPopover.ContentProps {
	portalled?: boolean;
	portalRef?: RefObject<HTMLElement>;
}

export const PopoverContent = forwardRef<
	HTMLDivElement,
	IPopoverContentProps
>(function PopoverContent(props, ref) {
	const { portalled = true, portalRef, ...rest } = props;
	return (
		<Portal disabled={!portalled} container={portalRef}>
			<ChakraPopover.Positioner>
				<ChakraPopover.Content ref={ref} {...rest} />
			</ChakraPopover.Positioner>
		</Portal>
	);
});

export const PopoverArrow = forwardRef<
	HTMLDivElement,
	ChakraPopover.ArrowProps
>(function PopoverArrow(props, ref) {
	return (
		<ChakraPopover.Arrow {...props} ref={ref}>
			<ChakraPopover.ArrowTip />
		</ChakraPopover.Arrow>
	);
});

export const PopoverCloseTrigger = forwardRef<
	HTMLButtonElement,
	ChakraPopover.CloseTriggerProps
>(function PopoverCloseTrigger(props, ref) {
	return (
		<ChakraPopover.CloseTrigger
			position="absolute"
			top="1"
			insetEnd="1"
			{...props}
			asChild
			ref={ref}
		>
			<CloseButton size="sm" />
		</ChakraPopover.CloseTrigger>
	);
});

export const PopoverTitle = ChakraPopover.Title;
export const PopoverDescription = ChakraPopover.Description;
export const PopoverFooter = ChakraPopover.Footer;
export const PopoverHeader = ChakraPopover.Header;
export const PopoverRoot = ChakraPopover.Root;
export const PopoverBody = ChakraPopover.Body;
export const PopoverTrigger = ChakraPopover.Trigger;
