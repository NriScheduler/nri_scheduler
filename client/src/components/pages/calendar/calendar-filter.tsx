import { UUID } from "node:crypto";

import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { HiCog } from "react-icons/hi";

import {
	Button,
	CheckboxControl,
	CheckboxHiddenInput,
	CheckboxLabel,
	CheckboxRoot,
	HStack,
	Input,
	Separator,
	Stack,
	Text,
} from "@chakra-ui/react";
import {
	AutoComplete,
	AutoCompleteInput,
	AutoCompleteItem,
	AutoCompleteList,
	AutoCompleteTag,
} from "@choc-ui/chakra-autocomplete";
import { useStore } from "@nanostores/preact";

import {
	DrawerBackdrop,
	DrawerBody,
	DrawerCloseTrigger,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerRoot,
	DrawerTitle,
	DrawerTrigger,
} from "../../ui/drawer";
import { Field } from "../../ui/field";
import { IEventsFilter } from "../../../api";
import {
	filterStore,
	getChangedFilters,
	resetFilters,
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
}

const LocationFilter = () => {
	const locations = useStore(sharedLocations);
	const { location, region, city } = useStore(filterStore);
	const selectedLocation = locations.find((loc) => loc.id === location);

	const onLocationChange = (value: UUID) => {
		filterStore.setKey("location", value);
		const found = locations.find((l) => l.id === value);
		filterStore.setKey("region", found?.region || "");
		filterStore.setKey("city", found?.city || "");
	};

	useEffect(() => {
		if (!location) {
			return;
		}
		if (selectedLocation) {
			filterStore.setKey("region", selectedLocation.region || "");
			filterStore.setKey("city", selectedLocation.city || "");
		}
	}, [location]);

	return (
		<Stack gap={4}>
			<Field label="Локация * ">
				<AutoComplete
					openOnFocus
					freeSolo
					value={location || ""}
					onChange={(value) => onLocationChange(value)}
				>
					<AutoCompleteInput variant="outline" />
					<AutoCompleteList bg="inherit">
						{locations.map((loc) => (
							<AutoCompleteItem
								key={loc.id}
								value={loc.id}
								label={loc.name}
								textTransform="capitalize"
								_hover={{
									bg: "gray.200",
								}}
							/>
						))}
					</AutoCompleteList>
				</AutoComplete>
			</Field>
			<Field label="Регион">
				<Input
					placeholder="Регион"
					value={region || ""}
					onChange={(e) =>
						filterStore.setKey("region", e.currentTarget.value)
					}
					disabled={!location}
				/>
			</Field>
			<Field label="Город">
				<Input
					placeholder="Город"
					value={city || ""}
					onChange={(e) =>
						filterStore.setKey("city", e.currentTarget.value)
					}
					disabled={!location}
				/>
			</Field>
		</Stack>
	);
};

const CompaniesFilter = () => {
	const companies = useStore(sharedCompanies);
	const selectedCompanies = useStore(filterStore).company;
	const [inputValue, setInputValue] = useState("");

	return (
		<Field label="Кампании">
			<AutoComplete
				openOnFocus
				multiple
				value={selectedCompanies}
				restoreOnBlurIfEmpty={false}
				onChange={(vals) => {
					filterStore.setKey("company", vals);
					setInputValue("");
				}}
			>
				<AutoCompleteInput
					variant="outline"
					disabled={companies.length < 1}
					placeholder="Выберите кампанию"
					value={inputValue}
				>
					{({ tags }) =>
						tags.map((tag, tid) => (
							<AutoCompleteTag
								key={tid}
								label={tag.label}
								onRemove={tag.onRemove}
								mb={4}
								mr={2}
								onClick={(e) => {
									e.preventDefault();
									tag.onRemove();
								}}
							/>
						))
					}
				</AutoCompleteInput>

				<AutoCompleteList bg="inherit">
					{companies.map((company) => (
						<AutoCompleteItem
							key={company.id}
							value={company.id}
							label={company.name}
							textTransform="capitalize"
							_hover={{
								bg: "gray.200",
							}}
						/>
					))}
				</AutoCompleteList>
			</AutoComplete>
		</Field>
	);
};

const MasterFilter = () => {
	const { showOwnGames, showOtherMasters } = useStore(filterStore);

	const toggleOwn = () => filterStore.setKey("showOwnGames", !showOwnGames);
	const toggleOthers = () =>
		filterStore.setKey("showOtherMasters", !showOtherMasters);

	return (
		<Stack gap={2} w="full">
			<CheckboxRoot
				mt={2}
				checked={showOwnGames}
				onChange={() => toggleOwn()}
			>
				<CheckboxHiddenInput />
				<CheckboxControl />
				<CheckboxLabel>Игры, которые я веду</CheckboxLabel>
			</CheckboxRoot>

			<CheckboxRoot
				mt={2}
				checked={showOtherMasters}
				onChange={() => toggleOthers()}
			>
				<CheckboxHiddenInput />
				<CheckboxControl />
				<CheckboxLabel>Игры, которые ведут другие</CheckboxLabel>
			</CheckboxRoot>

			{/* {showOtherMasters && (
				<Field label="Мастера на игре">
					<Input
						type="text"
						placeholder="Выберите из списка"
						value={master}
						onChange={(e) =>
							filterStore.setKey("master", e.currentTarget.value)
						}
					/>
				</Field>
			)} */}
		</Stack>
	);
};

export const CalendarFilter = ({
	isOpen,
	openDrawer,
	closeDrawer,
	applyFilters,
}: ICalendarFilterProps) => {
	const { applied, not_rejected } = useStore(filterStore);
	const [activeCount, setActiveCount] = useState(0);

	const handleSubmit = async (e: Event) => {
		e.preventDefault();

		const { showOwnGames, showOtherMasters, ...rest } = filterStore.get();

		let imamaster: boolean | null = null;

		if (showOwnGames && !showOtherMasters) {
			imamaster = true;
		} else if (!showOwnGames && showOtherMasters) {
			imamaster = false;
		}

		const filtered: Partial<IEventsFilter> = {
			...rest,
			...(imamaster !== null ? { imamaster } : {}),
		};

		applyFilters(filtered);
		closeDrawer();
	};

	useEffect(() => {
		const unsubscribe = filterStore.subscribe(() => {
			const changed = getChangedFilters();
			setActiveCount(Object.keys(changed).length);
		});
		return () => unsubscribe();
	}, []);

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
							<LocationFilter />
							<HStack>
								<Separator flex="1" />
								<Text flexShrink="0">Организатор</Text>
								<Separator flex="1" />
							</HStack>
							<HStack gap="2" w="full">
								<MasterFilter />
							</HStack>
							<CompaniesFilter />

							<HStack mb={2}>
								<Separator flex="1" />
								<Text flexShrink="0">Дополнительно</Text>
								<Separator flex="1" />
							</HStack>
							<CheckboxRoot
								checked={Boolean(applied)}
								onChange={() => filterStore.setKey("applied", !applied)}
							>
								<CheckboxHiddenInput />
								<CheckboxControl />
								<CheckboxLabel>Заявка подана</CheckboxLabel>
							</CheckboxRoot>
							<CheckboxRoot
								checked={Boolean(not_rejected)}
								onChange={() =>
									filterStore.setKey("not_rejected", !not_rejected)
								}
							>
								<CheckboxHiddenInput />
								<CheckboxControl />
								<CheckboxLabel>Не отклонена</CheckboxLabel>
							</CheckboxRoot>
						</Stack>
					</form>
				</DrawerBody>
				<DrawerFooter>
					<Button
						type="submit"
						// disabled={isSubmitting}
						onClick={handleSubmit}
					>
						Применить {activeCount === 0 ? "" : `(${activeCount})`}
					</Button>
					<Button
						type="reset"
						variant="outline"
						// disabled={isLoading}
						onClick={() => resetFilters()}
					>
						Сбросить
					</Button>
				</DrawerFooter>
				<DrawerCloseTrigger />
			</DrawerContent>
		</DrawerRoot>
	);
};
