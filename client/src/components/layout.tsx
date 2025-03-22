import { h } from "preact";
import { Toaster } from "react-hot-toast";

import { Header } from "./header";
import { Provider } from "./ui/provider";

export const Layout = ({ page }: { page: h.JSX.Element }) => (
	<Provider>
		<Header />
		<main>
			{page}
			<Toaster position="bottom-right" />
		</main>
	</Provider>
);
