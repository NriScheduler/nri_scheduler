import { ReactNode } from "react";

import {
	Checkbox as Cbox,
	CheckboxCheckedChangeDetails,
} from "@chakra-ui/react";

export interface ICheckboxProps {
	readonly checked?: boolean;
	readonly children: ReactNode | string;
	readonly onChange?: (e: CheckboxCheckedChangeDetails) => void;
}

export const Checkbox = (p: ICheckboxProps) => (
	<Cbox.Root checked={p.checked} onCheckedChange={p.onChange}>
		<Cbox.HiddenInput />
		<Cbox.Control />
		<Cbox.Label>{p.children}</Cbox.Label>
	</Cbox.Root>
);
