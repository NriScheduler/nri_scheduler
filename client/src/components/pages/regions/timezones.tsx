import { h } from "preact";

import { createListCollection, Portal, Select } from "@chakra-ui/react";

import { TIMEZONES } from "../../../store/profile";

interface TimesonesListProps {
	value: string;
	onChange: (value: string) => void;
}

const RUSSIAN_TIMEZONES = new Set([
	"Europe/Kaliningrad",
	"Europe/Moscow",
	"Europe/Samara",
	"Asia/Yekaterinburg",
	"Asia/Omsk",
	"Asia/Krasnoyarsk",
	"Asia/Irkutsk",
	"Asia/Yakutsk",
	"Asia/Vladivostok",
	"Asia/Magadan",
	"Asia/Kamchatka",
]);

export const TimesonesList = ({ value, onChange }: TimesonesListProps) => {
	// Создаем коллекцию с сортировкой
	const collection = createListCollection({
		items: Array.from(TIMEZONES)
			.map(([offset, tzName]) => ({
				label: `${offset < 0 ? offset : "+" + offset} (${tzName})`,
				value: tzName,
				category: RUSSIAN_TIMEZONES.has(tzName) ? "Россия" : "Другие",
				offset: offset, // Сохраняем оригинальное смещение для сортировки
			}))
			.sort((a, b) => {
				// Сначала российские, потом остальные
				if (a.category === "Россия" && b.category !== "Россия") {
					return -1;
				}
				if (a.category !== "Россия" && b.category === "Россия") {
					return 1;
				}
				// Внутри групп сортируем по смещению (от меньшего к большему)
				return a.offset - b.offset;
			}),
	});

	// Группируем по категориям
	const categories = Object.entries(
		groupBy(collection.items, (item) => item.category),
	);

	function groupBy<T>(
		array: T[],
		keyGetter: (item: T) => string,
	): Record<string, T[]> {
		return array.reduce(
			(result, item) => {
				const key = keyGetter(item);
				if (!result[key]) {
					result[key] = [];
				}
				result[key].push(item);
				return result;
			},
			{} as Record<string, T[]>,
		);
	}

	return (
		<Select.Root
			collection={collection}
			value={[value]}
			onValueChange={(details) => onChange(details.value[0])}
			size="sm"
			width="100%"
		>
			<Select.HiddenSelect />
			<Select.Control>
				<Select.Trigger>
					<Select.ValueText placeholder="Выберите часовой пояс" />
				</Select.Trigger>
				<Select.IndicatorGroup>
					<Select.Indicator />
				</Select.IndicatorGroup>
			</Select.Control>
			<Portal>
				<Select.Positioner>
					<Select.Content>
						{categories.map(([category, items]) => (
							<Select.ItemGroup key={category}>
								<Select.ItemGroupLabel>
									{category}
								</Select.ItemGroupLabel>
								{items.map((item) => (
									<Select.Item item={item} key={item.value}>
										{item.label}
										<Select.ItemIndicator />
									</Select.Item>
								))}
							</Select.ItemGroup>
						))}
					</Select.Content>
				</Select.Positioner>
			</Portal>
		</Select.Root>
	);
};
