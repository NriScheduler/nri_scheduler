import { h } from "preact";
import { useState } from "preact/hooks";
import { useRouter } from "preact-router";

import {
	Box,
	Button,
	Container,
	Flex,
	HStack,
	Link,
	Stack,
	Text,
} from "@chakra-ui/react";
import { useStore } from "@nanostores/preact";

import { Avatar } from "./ui/avatar";
import { Popover } from "./ui/popover";
import { logout } from "../api";
import { $profile } from "../store/profile";

export const Header = () => {
	const [{ path }] = useRouter();
	const [open, setOpen] = useState(false);

	const profile = useStore($profile);

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
							minHeight="44px"
						>
							НРИ Календарь
						</Link>
						{profile?.signed ? (
							<Popover
								open={open}
								onOpenChange={(e) => setOpen(e.open)}
								positioning={{ placement: "bottom-end" }}
								content={
									<Stack>
										<Link
											href="/profile"
											onClick={() => setOpen(false)}
										>
											Профиль
										</Link>
										<Link
											href="/signin"
											colorPalette="red"
											onClick={() => {
												logout();
												setOpen(false);
											}}
										>
											Выйти
										</Link>
									</Stack>
								}
							>
								<HStack key={profile?.email} gap="4">
									<Avatar src={profile.avatar_link} />
									<Stack gap="0">
										<Text fontWeight="medium">
											{profile?.nickname}
										</Text>
										<Text color="fg.muted" textStyle="sm">
											{profile?.email}
										</Text>
									</Stack>
								</HStack>
							</Popover>
						) : (
							path !== "/signin" &&
							path !== "/signup" && (
								<Link href="/signin" ml="auto">
									<Button type="button" h="44px">
										Вход и регистрация
									</Button>
								</Link>
							)
						)}
					</Flex>
				</Container>
			</Box>
		</header>
	);
};
