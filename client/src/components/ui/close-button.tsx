import { h } from "preact"; // eslint-disable-line
import type { ButtonProps } from "@chakra-ui/react";
import { IconButton as ChakraIconButton } from "@chakra-ui/react";

import { LuX } from "react-icons/lu";
import React from "preact/compat";

export type CloseButtonProps = ButtonProps;

export const CloseButton = React.forwardRef<
	HTMLButtonElement,
	CloseButtonProps
>(function CloseButton(props, ref) {
	return (
		<ChakraIconButton variant="ghost" aria-label="Close" ref={ref} {...props}>
			{props.children ?? <LuX />}
		</ChakraIconButton>
	);
});
