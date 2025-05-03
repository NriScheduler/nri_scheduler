import { h } from "preact";

import { NativeSelect } from "@chakra-ui/react";

import { TIMEZONES } from "../../../store/profile";

interface TimesonesListProps {
	value: number | string | null;
	onChange: (value: number | null) => void;
}

export const TimesonesList = ({ value, onChange }: TimesonesListProps) => {
	// Преобразуем входное значение в строку для выбора
	const selectValue =
		typeof value === "number"
			? Array.from(TIMEZONES).find(([offset]) => offset === value)?.[1] || ""
			: value || "";

	// Обработчик изменения
	const handleChange = (tzName: string) => {
		const offset =
			Array.from(TIMEZONES).find(([, name]) => name === tzName)?.[0] ?? null;
		onChange(offset);
	};

	const tzOptions = Array.from(TIMEZONES).map(([offset, tzName]) => (
		<option value={tzName} key={tzName}>
			{`${offset < 0 ? offset : "+" + offset} (${tzName})`}
		</option>
	));

	return (
		<NativeSelect.Root>
			<NativeSelect.Field
				placeholder="Выберите часовой пояс"
				value={selectValue}
				onChange={(e) => handleChange(e.currentTarget.value)}
			>
				{tzOptions}
			</NativeSelect.Field>
			<NativeSelect.Indicator />
		</NativeSelect.Root>
	);
};
