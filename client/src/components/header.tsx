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
import { h } from "preact"; // eslint-disable-line
import { route as navigate } from "preact-router";

import { useState } from "preact/hooks";

import {
	PopoverArrow,
	PopoverBody,
	PopoverContent,
	PopoverRoot,
	PopoverTrigger,
} from "./ui/popover";
import { useStore } from "@nanostores/preact";
import { $signed, fetchUserData, userStore } from "../store/profile";
import { API_HOST, logout } from "../api";
import { useEffect } from "react";

export const Header = () => {
	const [open, setOpen] = useState(false);
	const auth = useStore($signed);
	const user = useStore(userStore);

	useEffect(() => {
		fetchUserData();
	}, [auth]);

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
						{auth ? (
							<PopoverRoot
								open={open}
								onOpenChange={(e) => {
									if (e) {
										setOpen(e.open);
									}
								}}
								positioning={{ placement: "bottom-end" }}
							>
								<PopoverTrigger asChild cursor="pointer">
									<Stack gap="8">
										<HStack key={user?.email} gap="4">
											<Avatar.Root>
												<Avatar.Fallback name={user?.nickname} />
												<Avatar.Image
													src={`${
														API_HOST + "/api" + user?.avatar_link
													}`}
												/>
											</Avatar.Root>
											<Stack gap="0">
												<Text fontWeight="medium">
													{user?.nickname}
												</Text>
											</Stack>
										</HStack>
									</Stack>
								</PopoverTrigger>
								<PopoverContent>
									<PopoverArrow />
									<PopoverBody>
										<Stack gapY={2}>
											<Link href="/profile">Профиль</Link>
											<Link
												href="#"
												colorPalette="red"
												onClick={() => {
													logout();
													navigate("/signin");
												}}
											>
												Выйти
											</Link>
										</Stack>
									</PopoverBody>
								</PopoverContent>
							</PopoverRoot>
						) : (
							<Link href="/signin" ml="auto">
								<Button type="button">Вход и регистрация</Button>
							</Link>
						)}
					</Flex>
				</Container>
			</Box>
		</header>
	);
};
