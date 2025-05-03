import { h, JSX } from "preact";

import {
	AutoComplete,
	AutoCompleteGroup,
	AutoCompleteInput,
	AutoCompleteItem,
	AutoCompleteList,
} from "@choc-ui/chakra-autocomplete";

interface IProfileComplete {
	options: readonly string[];
	value: string | null;
	onChange: (value: string | null) => void;
	onBlur?: () => void;
	placeholder?: string;
}

export const ProfileComplete = ({
	options,
	value,
	onChange,
	onBlur,
	placeholder,
}: IProfileComplete) => {
	return (
		<AutoComplete
			onChange={(val: string) => {
				onChange(val);
			}}
			openOnFocus
			freeSolo
			value={value}
			emptyState="Ничего не найдено"
		>
			<AutoCompleteInput
				variant="outline"
				onBlur={onBlur}
				placeholder={placeholder}
				onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => {
					onChange(e.currentTarget.value || null);
				}}
			/>
			<AutoCompleteList bg="inherit">
				<AutoCompleteGroup>
					{options.map((option) => (
						<AutoCompleteItem
							key={option}
							value={option}
							textTransform="capitalize"
							_hover={{ bg: "gray.200" }}
							onClick={() => {
								onChange(option);
							}}
						/>
					))}
				</AutoCompleteGroup>
			</AutoCompleteList>
		</AutoComplete>
	);
};
