import { h } from "preact";

import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";

const system = createSystem(defaultConfig, {
	theme: {
		tokens: {},
	},
});

interface IProviderProps {
	children: h.JSX.Element | h.JSX.Element[];
}

export function Provider({ children }: IProviderProps) {
	return <ChakraProvider value={system}>{children}</ChakraProvider>;
}
