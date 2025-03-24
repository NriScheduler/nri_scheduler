import { h } from "preact";
import { useState } from "preact/hooks";


import { Avatar, Button, HStack, Input, Stack } from "@chakra-ui/react";

import { getMyProfile, setAvatar } from "../../../api";
import { toaster } from "../../ui/toaster";

export const ProfilePicture = ({ link }: { link: string }) => {
	const [isGenerated] = useState(link.startsWith("blob:"));
	const [newLink, setNewLink] = useState("");

	return (
		<HStack>
			<Avatar.Root w="100px" h="100px">
				<Avatar.Image src={link} />
			</Avatar.Root>
			<Stack>
				{isGenerated && "Сгенерированный аватар"}
				<HStack>
					<Input
						placeholder="Заполните поле"
						value={newLink}
						onChange={(e) => setNewLink(e.currentTarget.value)}
					/>
					<Button
						type="button"
						disabled={!newLink}
						onClick={() =>
							setAvatar(newLink)
								.then((res) => res && getMyProfile())
								.then(
									(res) =>
										res &&
										toaster.create({
											title: "Ссылка на аватар обновлена",
											type: "success"
										}),
								)
						}
					>
						Обновить ссылку
					</Button>
				</HStack>
			</Stack>
		</HStack>
	);
};
