import { h } from "preact";
import { FaBars, FaBorderAll } from "react-icons/fa";

import { Icon, Switch } from "@chakra-ui/react";

interface IViewToggle {
	isChecked: boolean;
	toggleCheckbox: () => void;
}

export const ViewToggle = ({ isChecked, toggleCheckbox }: IViewToggle) => {
	return (
		<Switch.Root
			colorPalette="cyan"
			checked={isChecked}
			onCheckedChange={toggleCheckbox}
		>
			<Switch.HiddenInput />
			<Switch.Control>
				<Switch.Thumb />
				<Switch.Indicator fallback={<Icon as={FaBars} />}>
					<Icon as={FaBorderAll} color="white" />
				</Switch.Indicator>
			</Switch.Control>
		</Switch.Root>
	);
};
