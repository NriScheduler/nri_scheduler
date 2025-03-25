import { h } from "preact";

import { Header } from "./header";
import { Provider } from "./ui/provider";
import { Toaster } from "./ui/toaster";

export const Layout = ({ page }: { page: h.JSX.Element }) => (
	<Provider>
		<Header />
		<main>
			{page}
			<Toaster />
		</main>
	</Provider>
);
