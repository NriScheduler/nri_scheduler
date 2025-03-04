import { h } from "preact";
import type { ButtonProps } from "@chakra-ui/react";
import { IconButton as ChakraIconButton } from "@chakra-ui/react";

import { LuX } from "react-icons/lu";
import { forwardRef } from "preact/compat";

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
