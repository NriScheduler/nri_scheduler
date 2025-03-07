import { ComponentChild, h } from "preact";
import { forwardRef } from "preact/compat";

import { Field as ChakraField } from "@chakra-ui/react";

export interface IFieldProps extends Omit<ChakraField.RootProps, "label"> {
	label?: ComponentChild;
	helperText?: ComponentChild;
	errorText?: ComponentChild;
	optionalText?: ComponentChild;
}

export const Field = forwardRef<HTMLDivElement, IFieldProps>(
	function Field(props, ref) {
		const { label, children, helperText, errorText, optionalText, ...rest } =
			props;
		return (
			<ChakraField.Root ref={ref} {...rest}>
				{label && (
					<ChakraField.Label>
						{label}
						<ChakraField.RequiredIndicator fallback={optionalText} />
					</ChakraField.Label>
				)}
				{children}
				{helperText && (
					<ChakraField.HelperText>{helperText}</ChakraField.HelperText>
				)}
				{errorText && (
					<ChakraField.ErrorText>{errorText}</ChakraField.ErrorText>
				)}
			</ChakraField.Root>
		);
	},
);
