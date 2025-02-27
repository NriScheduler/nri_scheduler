import {
	Avatar,
	Box,
	Button,
	Container,
	Flex,
	HStack,
	Link,
	Stack,
	Text,
} from "@chakra-ui/react";
import { h } from "preact";
import { useState } from "preact/hooks";

import {
	PopoverArrow,
	PopoverBody,
	PopoverContent,
	PopoverRoot,
	PopoverTrigger,
} from "./ui/popover";

export const Header = () => {
	const user = {
		email: "example@mail.ru",
		name: "Username",
		avatar: "/assets/photo.jpeg",
	};
	const [open, setOpen] = useState(false);

	return (
		<header>
			<Box borderBottomWidth={1} mb={6}>
				<Container>
					<Flex gap={4} align="center" justify="space-between" py="6">
						<Link
							variant="plain"
							href="/calendar"
							fontWeight={600}
							fontSize={24}
						>
							НРИ Календарь
						</Link>

						<Link href="/signin" ml="auto">
							<Button type="button">Вход и регистрация</Button>
						</Link>

						<PopoverRoot
							open={open}
							onOpenChange={(e) => setOpen(e.open)}
							positioning={{ placement: "bottom-end" }}
						>
							<PopoverTrigger asChild>
								<Stack gap="8">
									<HStack key={user.email} gap="4">
										<Avatar.Root>
											<Avatar.Fallback name={user.name} />
											<Avatar.Image src={user.avatar} />
										</Avatar.Root>
										<Stack gap="0">
											<Text fontWeight="medium">{user.name}</Text>
											<Text color="fg.muted" textStyle="sm">
												{user.email}
											</Text>
										</Stack>
									</HStack>
								</Stack>
							</PopoverTrigger>
							<PopoverContent>
								<PopoverArrow />
								<PopoverBody>
									<Stack gapY={2}>
										<Link href="#">Профиль</Link>
										<Link href="#" colorPalette="red">
											Выйти
										</Link>
									</Stack>
								</PopoverBody>
							</PopoverContent>
						</PopoverRoot>
					</Flex>
				</Container>
			</Box>
		</header>
	);
};
