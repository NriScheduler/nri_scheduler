import { ComponentType, h } from "preact";
import { lazy, Suspense } from "preact/compat";

export const LazyPage = (loader: () => Promise<{ default: ComponentType }>) => {
	const Component = lazy(loader);
	// eslint-disable-next-line react/display-name
	return () => (
		<Suspense fallback="">
			<Component />
		</Suspense>
	);
};
