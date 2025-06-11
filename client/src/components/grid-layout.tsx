import { ComponentChildren, h } from "preact";

import { Grid, GridProps, useBreakpointValue } from "@chakra-ui/react";

import { getGridColumnsConfig } from "./pages/profile/profile.data";

interface GridLayoutProps extends GridProps {
	children: ComponentChildren;
	gridColumns?: number;
	layoutMode?: boolean;
}

export const GridLayout = ({
	children,
	layoutMode = true,
}: GridLayoutProps) => {
	const gridColumns = useBreakpointValue(getGridColumnsConfig(layoutMode));

	return (
		<Grid templateColumns={`repeat(${gridColumns}, 1fr)`} gap="4">
			{children}
		</Grid>
	);
};
