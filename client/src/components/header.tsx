import { h } from "preact";
import { useEffect } from "preact/compat";
import { useState } from "preact/hooks";

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
import { useStore } from "@nanostores/preact";

import {
	PopoverArrow,
	PopoverBody,
	PopoverContent,
	PopoverRoot,
	PopoverTrigger,
} from "./ui/popover";
import { IApiProfile, logout, softCheck } from "../api";
import { $signed } from "../store/profile";

export const Header = () => {
	const [fetching, setFetching] = useState(false);
	const [userData, setUserData] = useState<IApiProfile | null>(null);
	const [open, setOpen] = useState(false);
	const signed = useStore($signed);

	useEffect(() => {
		setFetching(true);

		softCheck()
			.then((res) => {
				if (res) {
					setUserData(res.payload);
				}
			})
			.then(() => setFetching(false));
	}, [signed]);

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
						{!fetching &&
							(signed ? (
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
											<HStack key={userData?.email} gap="4">
												<Avatar.Root>
													<Avatar.Fallback
														name={userData?.nickname}
													/>
													<Avatar.Image src="https://gas-kvas.com/grafic/uploads/posts/2023-09/1695869715_gas-kvas-com-p-kartinki-bez-13.png" />
												</Avatar.Root>
												<Stack gap="0">
													<Text fontWeight="medium">
														{userData?.nickname}
													</Text>
													<Text color="fg.muted" textStyle="sm">
														{userData?.email}
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
										</PopoverBody>
									</PopoverContent>
								</PopoverRoot>
							) : (
								<Link href="/signin" ml="auto">
									<Button type="button" h="44px">
										Вход и регистрация
									</Button>
								</Link>
							))}
					</Flex>
				</Container>
			</Box>
		</header>
	);
};
