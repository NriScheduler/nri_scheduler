import { ReactNode } from "react";

import { Header } from "./header";
import { Provider } from "./ui/provider";
import { Toaster } from "./ui/toaster";

export const Layout = ({ page }: { page: ReactNode }) => (
	<Provider>
		<Header />
		<main>
			{page}
			<Toaster />
		</main>
	</Provider>
);
