import { h } from "preact";
import { forwardRef } from "preact/compat";
import { LuX } from "react-icons/lu";

import { ButtonProps, IconButton as ChakraIconButton } from "@chakra-ui/react";

export type CloseButtonProps = ButtonProps;

export const CloseButton = forwardRef<HTMLButtonElement, CloseButtonProps>(
	function CloseButton(props, ref) {
		return (
			<ChakraIconButton
				variant="ghost"
				aria-label="Close"
				ref={ref}
				{...props}
			>
				{props.children ?? <LuX />}
			</ChakraIconButton>
		);
	},
);
