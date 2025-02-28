import { ComponentChild, h, VNode } from "preact";
import { cloneElement, forwardRef } from "preact/compat";

import type { BoxProps, InputElementProps } from "@chakra-ui/react";
import { Group, InputElement } from "@chakra-ui/react";

export interface IInputGroupProps extends BoxProps {
	startElementProps?: InputElementProps;
	endElementProps?: InputElementProps;
	startElement?: ComponentChild;
	endElement?: ComponentChild;
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

		// const child = React.Children.only(children);

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
	}
);
