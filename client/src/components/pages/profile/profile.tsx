import { h } from "preact";

import { ProfileUpdate } from "./profile-update";

import {
	Avatar,
	Button,
	Card,
	Container,
	EmptyState,
	Grid,
	HStack,
	Link,
	Stack,
	Stat,
	Tabs,
	Tag,
	Text,
	VStack,
} from "@chakra-ui/react";
import { MdLocationPin, MdOutlineEvent } from "react-icons/md";
import { useStore } from "@nanostores/preact";
import { DEFAULT_PROFILE_IMAGE, userStore } from "../../../store/profile";
import { LuCircleUser, LuFileBadge } from "react-icons/lu";

interface IEvent {
	label?: string;
	value?: string;
	href?: string;
}

export const ProfilePage = () => {
	const user = useStore(userStore);

	const events: IEvent[] = [];

	const tags = [
		{
			label: "Дом милый дом",
			icon: <MdLocationPin />,
		},
		{
			label: "Мастер",
			icon: <LuFileBadge />,
		},
	];

	return (
		<Container mb={6}>
			<Card.Root overflow="hidden" mb={4} hidden>
				<Card.Body gap={2}>
					<HStack gap={6} justifyContent="space-between">
						<HStack>
							<Avatar.Root
								w="150px"
								h="150px"
								borderWidth="3px"
								borderColor="white"
								shape="rounded"
							>
								<Avatar.Fallback name={user?.nickname} />
								<Avatar.Image
									src={user?.avatar || DEFAULT_PROFILE_IMAGE}
								/>
							</Avatar.Root>
							<Stack>
								<Text fontWeight="semibold" textStyle="2xl">
									{user?.nickname || "Username"}
								</Text>
								<Text color="fg.muted" textStyle="lg">
									{user?.email || "me@example.ru"}
								</Text>
							</Stack>
						</HStack>
						<HStack>
							{tags &&
								tags.map((item) => (
									<Tag.Root key={item.label} size="lg">
										<Tag.StartElement>{item.icon}</Tag.StartElement>
										<Tag.Label>{item.label}</Tag.Label>
									</Tag.Root>
								))}
						</HStack>
					</HStack>
				</Card.Body>
			</Card.Root>
			<Tabs.Root defaultValue="user" variant="outline">
				<Tabs.List>
					<Tabs.Trigger value="user">Профиль</Tabs.Trigger>
					<Tabs.Trigger value="events">Заявки</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="events">
					{events.length !== 0 ? (
						events.map((item, index) => (
							<Grid templateColumns="repeat(4, 1fr)" gap="4">
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
				<Tabs.Content value="user">
					<ProfileUpdate user={user} />
				</Tabs.Content>
			</Tabs.Root>
		</Container>
	);
};
