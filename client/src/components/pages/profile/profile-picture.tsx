import { useState } from "react";

import { Button, HStack, Input, Stack } from "@chakra-ui/react";

import { Avatar } from "../../ui/avatar";
import { toaster } from "../../ui/toaster";
import { getMyProfile, setAvatar } from "../../../api";

export const ProfilePicture = ({ link }: { link: string }) => {
	const [isGenerated] = useState(link.startsWith("blob:"));
	const [newLink, setNewLink] = useState("");

	return (
		<HStack>
			<Avatar src={link} w="100px" h="100px" />
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
										toaster.success({
											title: "Ссылка на аватар обновлена",
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
