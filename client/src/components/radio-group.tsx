import { h } from "preact";

import { HStack, RadioGroup } from "@chakra-ui/react";

import { ETzVariant } from "../api";

const timezoneVariants = [
	ETzVariant.CITY,
	ETzVariant.DEVICE,
	ETzVariant.OWN,
] as const;

const getTimezoneVariantLabel = (variant: ETzVariant) => {
	switch (variant) {
		case ETzVariant.CITY:
			return "Брать из города";
		case ETzVariant.DEVICE:
			return "Брать с устройства";
		case ETzVariant.OWN:
			return "Указать вручную";
		default:
			return variant;
	}
};

export const TimezoneRadioGroup = ({
	value,
	onChange,
}: {
	value: ETzVariant;
	onChange: (value: ETzVariant) => void;
}) => {
	return (
		<RadioGroup.Root
			value={value}
			onValueChange={(e) => onChange(e.value as ETzVariant)}
		>
			<HStack gap="6">
				{timezoneVariants.map((variant) => (
					<RadioGroup.Item key={variant} value={variant}>
						<RadioGroup.ItemHiddenInput />
						<RadioGroup.ItemIndicator />
						<RadioGroup.ItemText>
							{getTimezoneVariantLabel(variant)}
						</RadioGroup.ItemText>
					</RadioGroup.Item>
				))}
			</HStack>
		</RadioGroup.Root>
	);
};
