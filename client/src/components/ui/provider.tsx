import { ReactNode } from "react";

import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";

const system = createSystem(defaultConfig, {
	theme: {
		tokens: {},
	},
});

interface IProviderProps {
	children: ReactNode | ReactNode[];
}

export function Provider({ children }: IProviderProps) {
	return <ChakraProvider value={system}>{children}</ChakraProvider>;
}
