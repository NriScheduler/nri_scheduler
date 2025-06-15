import { UUID } from "node:crypto";

import { h } from "preact";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { HiCog } from "react-icons/hi";

import {
	Badge,
	Button,
	CheckboxControl,
	CheckboxHiddenInput,
	CheckboxLabel,
	CheckboxRoot,
	Combobox,
	HStack,
	Portal,
	Separator,
	Span,
	Stack,
	Text,
	useFilter,
	useListCollection,
	Wrap,
} from "@chakra-ui/react";
import { useStore } from "@nanostores/preact";

import { CloseButton } from "../../ui/close-button";
import {
	DrawerBackdrop,
	DrawerBody,
	DrawerCloseTrigger,
	DrawerContent,
	DrawerHeader,
	DrawerRoot,
	DrawerTitle,
	DrawerTrigger,
} from "../../ui/drawer";
import { IEventsFilter } from "../../../api";
import {
	$masterFilters,
	$playerFilters,
	IFilterState,
	initialMasterFilters,
	initialPlayerFilters,
} from "../../../store/filters";
import {
	sharedCompanies,
	sharedLocations,
} from "../../../store/sharedDataStore";

interface ICalendarFilterProps {
	isOpen: boolean;
	openDrawer: () => void;
	closeDrawer: () => void;
	applyFilters: (filters: IEventsFilter) => void;
	isMaster: boolean;
}

interface Location {
	readonly id: UUID;
	readonly name: string;
	readonly region: string;
	readonly city: string;
}

interface Company {
	readonly id: UUID;
	readonly name: string;
}

interface IFilterProps {
	isMaster: boolean;
}

const LocationFilter = ({ isMaster }: IFilterProps) => {
	const locations = useStore(sharedLocations);
	const filterStore = useMemo(
		() => (isMaster ? $masterFilters : $playerFilters),
		[isMaster],
	);

	const { location } = useStore(filterStore);

	const transformedData = useMemo(
		() =>
			locations.map((item) => ({
				id: item.id,
				name: item.name ?? "",
				region: item.region ?? "",
				city: item.city ?? "",
			})),
		[locations],
	);

	const { contains } = useFilter({ sensitivity: "base" });

	const { collection, filter } = useListCollection({
		initialItems: transformedData,
		filter: contains,
		itemToString: (item) => `${item.name}, ${item.city}`,
		itemToValue: (item) => item.id.toString(),
	});

	const selectedLocation = useMemo(
		() => transformedData.find((loc) => loc.id === location) || null,
		[transformedData, location],
	);

	const handleValueChange = (values: string[]) => {
		const selectedId = values[0] || null;
		const selected = selectedId
			? transformedData.find((loc) => loc.id === selectedId)
			: null;

		filterStore.set({
			...filterStore.get(),
			location: selected?.id || null,
			region: selected?.region || null,
			city: selected?.city || null,
		});
	};

	return (
		<Combobox.Root<Location>
			closeOnSelect
			collection={collection}
			inputBehavior="autocomplete"
			placeholder="Выберите локацию"
			onInputValueChange={(details) => filter(details.inputValue)}
			onValueChange={({ value }) => handleValueChange(value || [])}
			value={selectedLocation ? [selectedLocation.id] : []}
		>
			<Combobox.Label>Локация</Combobox.Label>

			<Combobox.Control>
				<Combobox.Input
					value={
						selectedLocation
							? `${selectedLocation.name}, ${selectedLocation.city}`
							: ""
					}
				/>
				<Combobox.IndicatorGroup>
					<Combobox.ClearTrigger
						onClick={() => {
							filterStore.set({
								...filterStore.get(),
								location: null,
								region: null,
								city: null,
							});
						}}
					/>
					<Combobox.Trigger />
				</Combobox.IndicatorGroup>
			</Combobox.Control>
			<Portal>
				<Combobox.Positioner zIndex={"popover !important"}>
					<Combobox.Content>
						<Combobox.Empty>Ничего не найдено</Combobox.Empty>
						{collection.items.map((item) => (
							<Combobox.Item item={item} key={item.id}>
								<Stack gap={0}>
									<Span textStyle="sm" fontWeight="medium">
										{item.name}
									</Span>
									<Span textStyle="xs" color="fg.muted">
										{item.region} - {item.city}
									</Span>
								</Stack>
								<Combobox.ItemIndicator />
							</Combobox.Item>
						))}
					</Combobox.Content>
				</Combobox.Positioner>
			</Portal>
		</Combobox.Root>
	);
};

const CompaniesFilter = ({ isMaster }: IFilterProps) => {
	const companies = useStore(sharedCompanies);
	const filterStore = useMemo(
		() => (isMaster ? $masterFilters : $playerFilters),
		[isMaster],
	);

	const { company: selectedCompanyIds } = useStore(filterStore);

	const transformedData = useMemo<Company[]>(
		() =>
			companies.map((item) => ({
				id: item.id,
				name: item.name ?? "",
			})),
		[companies],
	);

	const { contains } = useFilter({ sensitivity: "base" });

	const { collection, filter } = useListCollection({
		initialItems: transformedData,
		filter: contains,
		itemToString: (item) => item.name,
		itemToValue: (item) => item.id.toString(),
	});

	const selectedCompanies = useMemo(
		() =>
			selectedCompanyIds
				? transformedData.filter((item) =>
						selectedCompanyIds.includes(item.id),
					)
				: [],
		[transformedData, selectedCompanyIds],
	);
	const handleValueChange = (values: UUID[]) => {
		filterStore.set({
			...filterStore.get(),
			company: values.length > 0 ? values : null,
		});
	};

	return (
		<Combobox.Root<Company>
			collection={collection}
			placeholder="Выберите кампанию"
			onInputValueChange={(details) => filter(details.inputValue)}
			onValueChange={({ value }) =>
				handleValueChange((value || []) as UUID[])
			}
			value={selectedCompanyIds || []}
			// closeOnSelect
			multiple
		>
			<Combobox.Label>Кампании</Combobox.Label>

			<Combobox.Control>
				<Combobox.Input />
				<Combobox.IndicatorGroup>
					<Combobox.Trigger />
				</Combobox.IndicatorGroup>
			</Combobox.Control>
			<Wrap gap={2}>
				{selectedCompanies.map((company) => (
					<Badge key={company.id} size="sm" pl={2} pr={1}>
						{company.name}
						<CloseButton
							size="xs"
							onClick={() => {
								const newIds =
									selectedCompanyIds?.filter(
										(id) => id !== company.id,
									) || [];
								handleValueChange(newIds);
							}}
						/>
					</Badge>
				))}
			</Wrap>
			<Portal>
				<Combobox.Positioner zIndex={"popover !important"}>
					<Combobox.Content>
						<Combobox.Empty>Ничего не найдено</Combobox.Empty>
						{collection.items.map((item) => (
							<Combobox.Item item={item} key={item.id}>
								<Span flex="1">{item.name}</Span>
								<Combobox.ItemIndicator />
							</Combobox.Item>
						))}
					</Combobox.Content>
				</Combobox.Positioner>
			</Portal>
		</Combobox.Root>
	);
};

const MasterFilter = ({ isMaster }: IFilterProps) => {
	const filterStore = useMemo(
		() => (isMaster ? $masterFilters : $playerFilters),
		[isMaster],
	);

	const { showOwnGames, showOtherMasters } = useStore(filterStore);

	const toggleOwn = useCallback(() => {
		filterStore.setKey("showOwnGames", !showOwnGames);
	}, [filterStore, showOwnGames]);

	const toggleOthers = useCallback(() => {
		filterStore.setKey("showOtherMasters", !showOtherMasters);
	}, [filterStore, showOtherMasters]);

	return (
		<Stack gap={2} w="full">
			<CheckboxRoot
				mt={2}
				checked={showOwnGames ?? false}
				onChange={toggleOwn}
			>
				<CheckboxHiddenInput />
				<CheckboxControl />
				<CheckboxLabel>Игры, которые я веду</CheckboxLabel>
			</CheckboxRoot>

			<CheckboxRoot
				mt={2}
				checked={showOtherMasters ?? false}
				onChange={toggleOthers}
			>
				<CheckboxHiddenInput />
				<CheckboxControl />
				<CheckboxLabel>Игры, которые ведут другие</CheckboxLabel>
			</CheckboxRoot>
		</Stack>
	);
};

export const CalendarFilter = ({
	isOpen,
	openDrawer,
	closeDrawer,
	applyFilters,
	isMaster,
}: ICalendarFilterProps) => {
	const [activeCount, setActiveCount] = useState(0);

	// Оптимизированные хранилища и состояния
	const filterStore = useMemo(
		() => (isMaster ? $masterFilters : $playerFilters),
		[isMaster],
	);

	const filters = useStore(filterStore);
	const initialFilters = useMemo(
		() => (isMaster ? initialMasterFilters : initialPlayerFilters),
		[isMaster],
	);

	// Обработчик отправки формы
	const handleSubmit = useCallback(
		async (e: Event) => {
			e.preventDefault();

			const { showOwnGames, showOtherMasters, ...rest } = filters;

			const imamaster =
				showOwnGames && !showOtherMasters
					? true
					: !showOwnGames && showOtherMasters
						? false
						: null;

			applyFilters({
				...rest,
				...(imamaster !== null && { imamaster }),
			});
			closeDrawer();
		},
		[filters, applyFilters, closeDrawer],
	);

	// Получение измененных фильтров
	const getChangedFilters = useMemo(() => {
		return (): Partial<IFilterState> => {
			const changed: Partial<IFilterState> = {};

			const filterKeys: Array<keyof IFilterState> = [
				"location",
				"region",
				"city",
				"master",
				"company",
				"applied",
				"not_rejected",
				"imamaster",
				"showOwnGames",
				"showOtherMasters",
			];

			filterKeys.forEach((key) => {
				if (filters[key] !== initialFilters[key]) {
					// Проверка типа для каждого поля
					if (key === "company" && Array.isArray(filters[key])) {
						changed.company =
							filters.company as `${string}-${string}-${string}-${string}-${string}`[];
					} else if (key === "location" || key === "master") {
						changed[key] = filters[key] as
							| `${string}-${string}-${string}-${string}-${string}`
							| null;
					} else {
						changed[key] = filters[key] as never;
					}
				}
			});

			return changed;
		};
	}, [filters, initialFilters]);

	// Сброс фильтров
	const resetFilters = useCallback(() => {
		filterStore.set({ ...initialFilters });
		setActiveCount(0);
	}, [filterStore, initialFilters]);

	// Подписка на изменения фильтров
	useEffect(() => {
		const updateCount = () => {
			setActiveCount(Object.keys(getChangedFilters()).length);
		};

		const unsubscribe = filterStore.listen(updateCount);
		updateCount(); // Инициализация

		return unsubscribe;
	}, [filterStore, getChangedFilters]);

	return (
		<DrawerRoot
			open={isOpen}
			onOpenChange={(e) => (e.open ? openDrawer() : closeDrawer())}
		>
			<DrawerBackdrop />
			<DrawerTrigger asChild>
				<Button variant="outline">
					Фильтр {activeCount === 0 ? "" : `(${activeCount})`}
					<HiCog />
				</Button>
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Параметры фильтра</DrawerTitle>
				</DrawerHeader>
				<DrawerBody>
					<form>
						<Stack gap={2}>
							<HStack>
								<Separator flex="1" />
								<Text flexShrink="0">Геолокация</Text>
								<Separator flex="1" />
							</HStack>
							<LocationFilter isMaster={isMaster} />
							<HStack>
								<Separator flex="1" />
								<Text flexShrink="0">Организатор</Text>
								<Separator flex="1" />
							</HStack>
							<HStack gap="2" w="full">
								<MasterFilter isMaster={isMaster} />
							</HStack>
							<CompaniesFilter isMaster={isMaster} />

							<HStack mb={2}>
								<Separator flex="1" />
								<Text flexShrink="0">Дополнительно</Text>
								<Separator flex="1" />
							</HStack>
							<CheckboxRoot
								checked={filters.applied ?? false}
								onChange={() =>
									$masterFilters.setKey("applied", !filters.applied)
								}
							>
								<CheckboxHiddenInput />
								<CheckboxControl />
								<CheckboxLabel>Заявка подана</CheckboxLabel>
							</CheckboxRoot>
							<CheckboxRoot
								checked={filters.not_rejected ?? false}
								onChange={() =>
									$masterFilters.setKey(
										"not_rejected",
										!filters.not_rejected,
									)
								}
							>
								<CheckboxHiddenInput />
								<CheckboxControl />
								<CheckboxLabel>Не отклонена</CheckboxLabel>
							</CheckboxRoot>
						</Stack>
						<HStack gap={2} mt={6}>
							<Button
								w="1/2"
								type="submit"
								// disabled={isSubmitting}
								onClick={handleSubmit}
							>
								Применить {activeCount === 0 ? "" : `(${activeCount})`}
							</Button>
							<Button
								w="1/2"
								type="reset"
								variant="outline"
								// disabled={isLoading}
								onClick={resetFilters}
							>
								Сбросить
							</Button>
						</HStack>
					</form>
				</DrawerBody>
				<DrawerCloseTrigger />
			</DrawerContent>
		</DrawerRoot>
	);
};
