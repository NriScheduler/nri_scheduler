import { h } from "preact";
import { MdOutlineEvent } from "react-icons/md";

import {
	Button,
	Card,
	Container,
	EmptyState,
	Grid,
	Link,
	Tabs,
	VStack,
} from "@chakra-ui/react";
import { useStore } from "@nanostores/preact";

import { ProfileUpdate } from "./profile-update";

interface IEvent {
	label?: string;
	value?: string;
	href?: string;
}

export const ProfilePage = () => {
	const user: any = {};
	const events: IEvent[] = [];

	return (
		<Container mb={6}>
			<Tabs.Root defaultValue="user" variant="outline">
				<Tabs.List>
					<Tabs.Trigger value="user">Профиль</Tabs.Trigger>
					<Tabs.Trigger value="events">Заявки</Tabs.Trigger>
					<Tabs.Trigger value="resetpass">Сброс пароля</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="user" maxW="2xl">
					<ProfileUpdate user={user} />
				</Tabs.Content>

				<Tabs.Content value="events">
					{events.length !== 0 ? (
						events.map((item, index) => (
							<Grid templateColumns="repeat(4, 1fr)" gap="4" key={index}>
								<Card.Root>
									<Card.Body gap="2">
										<Card.Title mt="2">
											<Link href={item.href}>
												{item.label} {index + 1}
											</Link>
										</Card.Title>
										<Card.Description>{item.value}</Card.Description>
									</Card.Body>
									<Card.Footer>
										<Button variant="outline">Детально</Button>
									</Card.Footer>
								</Card.Root>
							</Grid>
						))
					) : (
						<EmptyState.Root w="full">
							<EmptyState.Content>
								<EmptyState.Indicator>
									<MdOutlineEvent />
								</EmptyState.Indicator>
								<VStack textAlign="center">
									<EmptyState.Title>
										Заявок на подтверждение нет
									</EmptyState.Title>
									<EmptyState.Description>
										Как только ... так сразу
									</EmptyState.Description>
								</VStack>
							</EmptyState.Content>
						</EmptyState.Root>
					)}
				</Tabs.Content>

				<Tabs.Content value="resetpass">resetpass</Tabs.Content>
			</Tabs.Root>
		</Container>
	);
};
