import { h } from "preact";

import { Button, Dialog, Portal } from "@chakra-ui/react";

import { CloseButton } from "../../ui/close-button";

interface IEventDialogProps {
	buttonTitle: string;
	handleClick: () => void;
}

export const EventDialog = ({
	buttonTitle,
	handleClick,
}: IEventDialogProps) => {
	return (
		<Dialog.Root role="alertdialog" placement="center">
			<Dialog.Trigger asChild>
				<Button type="button" variant="subtle" colorPalette="blue">
					{buttonTitle}
				</Button>
			</Dialog.Trigger>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<Dialog.Content>
						<Dialog.Header>
							<Dialog.Title>А вы уверены?</Dialog.Title>
						</Dialog.Header>
						<Dialog.Footer>
							<Dialog.ActionTrigger asChild>
								<Button variant="outline">Нет</Button>
							</Dialog.ActionTrigger>
							<Button colorPalette="red" onClick={handleClick}>
								Да
							</Button>
						</Dialog.Footer>
						<Dialog.CloseTrigger asChild>
							<CloseButton size="sm" />
						</Dialog.CloseTrigger>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
};
