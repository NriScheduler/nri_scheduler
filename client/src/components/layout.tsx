import { h } from "preact";
import { Provider } from "./ui/provider";

import { Toaster } from "react-hot-toast";
import { Header } from "./header";
import { Box } from "@chakra-ui/react";

export const Layout = ({ page }: { page: h.JSX.Element }) => (
	<Provider>
		<Header />
		<main>
			{page}
			<Toaster position="bottom-right" />
		</main>
	</Provider>
);
