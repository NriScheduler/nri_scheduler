import { h, VNode } from "preact";
import { cloneElement, forwardRef, ReactNode } from "preact/compat";

import {
	BoxProps,
	Group,
	InputElement,
	InputElementProps,
} from "@chakra-ui/react";

export interface IInputGroupProps extends BoxProps {
	startElementProps?: InputElementProps;
	endElementProps?: InputElementProps;
	startElement?: ReactNode;
	endElement?: ReactNode;
	children: VNode<InputElementProps>;
	startOffset?: InputElementProps["paddingStart"];
	endOffset?: InputElementProps["paddingEnd"];
}

export const InputGroup = forwardRef<HTMLDivElement, IInputGroupProps>(
	function InputGroup(props, ref) {
		const {
			startElement,
			startElementProps,
			endElement,
			endElementProps,
			children,
			startOffset = "6px",
			endOffset = "6px",
			...rest
		} = props;

		return (
			<Group ref={ref} {...rest}>
				{startElement && (
					<InputElement pointerEvents="none" {...startElementProps}>
						{startElement}
					</InputElement>
				)}
				{cloneElement(children, {
					...(startElement && {
						ps: `calc(var(--input-height) - ${startOffset})`,
					}),
					...(endElement && {
						pe: `calc(var(--input-height) - ${endOffset})`,
					}),
					...children.props,
				})}
				{endElement && (
					<InputElement placement="end" {...endElementProps}>
						{endElement}
					</InputElement>
				)}
			</Group>
		);
	},
);
