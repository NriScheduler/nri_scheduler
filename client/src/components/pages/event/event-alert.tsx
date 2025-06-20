import { h } from "preact";
import { ReactNode } from "preact/compat";
import { IconType } from "react-icons";

import { Alert } from "@chakra-ui/react";

interface IEventAlertProps {
	title: string;
	description?: ReactNode | string;
	status?: "info" | "warning" | "success" | "error" | "neutral";
	icon?: IconType;
}

export const EventAlert = ({
	title,
	description,
	status = "neutral",
	icon,
}: IEventAlertProps) => {
	return (
		<Alert.Root status={status} variant="surface" size={"sm"}>
			<Alert.Indicator>{icon}</Alert.Indicator>
			<Alert.Content>
				<Alert.Title>{title}</Alert.Title>
				<Alert.Description>{description}</Alert.Description>
			</Alert.Content>
		</Alert.Root>
	);
};
