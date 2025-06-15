import { h, RefObject } from "preact";
import { forwardRef, useEffect, useState } from "preact/compat";

import { Drawer as ChakraDrawer, Portal } from "@chakra-ui/react";

import { CloseButton } from "./close-button";

interface IDrawerContentProps extends ChakraDrawer.ContentProps {
	portalled?: boolean;
	portalRef?: RefObject<HTMLElement>;
	offset?: ChakraDrawer.ContentProps["padding"];
}

interface IDrawerRootProps extends ChakraDrawer.RootProps {
	defaultOpen?: boolean;
}

export const DrawerRoot = forwardRef<HTMLDivElement, IDrawerRootProps>(
	function DrawerRoot(
		{ open, onOpenChange, defaultOpen = false, ...props },
		ref,
	) {
		// Внутреннее состояние для неконтролируемого режима
		const [isOpen, setIsOpen] = useState(defaultOpen);

		// Определяем, используем ли мы контролируемый режим
		const isControlled = open !== undefined;
		const currentOpen = isControlled ? open : isOpen;

		const handleOpenChange = (e: { open: boolean }) => {
			if (!isControlled) {
				setIsOpen(e.open);
			}
			onOpenChange?.(e);
		};

		useEffect(() => {
			if (!currentOpen) {
				return;
			}

			const handleEscape = (e: KeyboardEvent) => {
				if (e.key === "Escape") {
					handleOpenChange({ open: false });
				}
			};

			document.addEventListener("keydown", handleEscape);
			return () => document.removeEventListener("keydown", handleEscape);
		}, [currentOpen]);

		return (
			<ChakraDrawer.Root
				ref={ref}
				open={currentOpen}
				onOpenChange={handleOpenChange}
				modal={true}
				{...props}
			/>
		);
	},
);

export const DrawerContent = forwardRef<HTMLDivElement, IDrawerContentProps>(
	function DrawerContent(props, ref) {
		const { children, portalled = true, portalRef, offset, ...rest } = props;
		return (
			<Portal disabled={!portalled} container={portalRef}>
				<ChakraDrawer.Positioner padding={offset}>
					<ChakraDrawer.Content ref={ref} {...rest} asChild={false}>
						{children}
					</ChakraDrawer.Content>
				</ChakraDrawer.Positioner>
			</Portal>
		);
	},
);

export const DrawerCloseTrigger = forwardRef<
	HTMLButtonElement,
	ChakraDrawer.CloseTriggerProps
>(function DrawerCloseTrigger(props, ref) {
	return (
		<ChakraDrawer.CloseTrigger
			position="absolute"
			top="2"
			insetEnd="2"
			{...props}
			asChild
		>
			<CloseButton size="sm" ref={ref} />
		</ChakraDrawer.CloseTrigger>
	);
});

export const DrawerTrigger = ChakraDrawer.Trigger;
// export const DrawerRoot = ChakraDrawer.Root;
export const DrawerFooter = ChakraDrawer.Footer;
export const DrawerHeader = ChakraDrawer.Header;
export const DrawerBody = ChakraDrawer.Body;
export const DrawerBackdrop = ChakraDrawer.Backdrop;
export const DrawerDescription = ChakraDrawer.Description;
export const DrawerTitle = ChakraDrawer.Title;
export const DrawerActionTrigger = ChakraDrawer.ActionTrigger;
