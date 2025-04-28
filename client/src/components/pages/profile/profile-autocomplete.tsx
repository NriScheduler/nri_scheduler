import { h } from "preact";

import {
	AutoComplete,
	AutoCompleteGroup,
	AutoCompleteInput,
	AutoCompleteItem,
	AutoCompleteList,
} from "@choc-ui/chakra-autocomplete";

interface IProfileComplete {
	handleChange: (value: string) => void;
	options: readonly string[];
	value: string | number;
	placeholder?: string;
}

export const ProfileComplete = ({
	handleChange,
	options,
	value,
	...props
}: IProfileComplete) => {
	return (
		<AutoComplete
			onChange={handleChange}
			openOnFocus
			freeSolo
			value={value}
			emptyState="Ничего не найдено"
		>
			<AutoCompleteInput variant="outline" {...props} />
			<AutoCompleteList bg="inherit">
				<AutoCompleteGroup>
					{options.map((option) => (
						<AutoCompleteItem
							key={option}
							value={option}
							textTransform="capitalize"
							_hover={{
								bg: "gray.200",
							}}
						/>
					))}
				</AutoCompleteGroup>
			</AutoCompleteList>
		</AutoComplete>
	);
};
