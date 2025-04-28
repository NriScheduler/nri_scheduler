import { h } from "preact";

import { NativeSelect } from "@chakra-ui/react";

import { TIMEZONES } from "../../../store/profile";

interface TimesonesListProps {
	value: string;
	onChange: (value: string) => void;
}

export const TimesonesList = ({ value, onChange }: TimesonesListProps) => {
	const tzOptions = Array.from(TIMEZONES)
		.sort((a, b) => b[0] - a[0])
		.map(([offset, tzName]) => (
			<option value={tzName} key={tzName}>
				{`${offset < 0 ? offset : "+" + offset} (${tzName})`}
			</option>
		));

	return (
		<NativeSelect.Root>
			<NativeSelect.Field
				placeholder="Выберите часовой пояс"
				value={value}
				onChange={(e: { currentTarget: { value: string } }) =>
					onChange(e.currentTarget.value)
				}
			>
				{tzOptions}
			</NativeSelect.Field>
			<NativeSelect.Indicator />
		</NativeSelect.Root>
	);
};
