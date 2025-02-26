import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";
import { JSX } from "preact";

const system = createSystem(defaultConfig, {
	theme: {
		tokens: {},
	},
});

interface ProviderProps {
	children: JSX.Element | JSX.Element[];
}

export function Provider({ children }: ProviderProps) {
	return <ChakraProvider value={system} children={children} />;
}
