import { h } from "preact";

import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";

import { Header } from "./header";
import { Toaster } from "./ui/toaster";

const system = createSystem(defaultConfig, {
	theme: {
		tokens: {},
	},
});

export const Layout = ({ children }: { readonly children: h.JSX.Element }) => (
	<ChakraProvider value={system}>
		<Header />
		<main>
			{children}
			<Toaster />
		</main>
	</ChakraProvider>
);
