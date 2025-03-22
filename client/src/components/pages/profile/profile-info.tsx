import { Fragment, h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { route as navigate } from "preact-router";

import {
	Avatar,
	Button,
	DataList,
	Heading,
	HStack,
	Separator,
	Stack,
} from "@chakra-ui/react";

import { IStorePrifile, TIMEZONES } from "../../../store/profile";

const NOT_SET = "Не установлен";

interface IProfileInfoProps {
	readonly user: IStorePrifile;
}

export const ProfileInfo = ({ user }: IProfileInfoProps) => {
	const [timeZone, setTimeZone] = useState(NOT_SET);

	useEffect(() => {
		setTimeZone(
			user.timezone_offset || user.timezone_offset === 0
				? `UTC ${user.timezone_offset >= 0 ? "+" : ""}${user.timezone_offset} (${TIMEZONES.get(user.timezone_offset)})`
				: NOT_SET,
		);
	}, [user.timezone_offset]);

	return (
		<>
			{/* Персональная информация */}
			<HStack py={6}>
				<Heading size="xl" flexShrink="0">
					Персональная информация
				</Heading>
				<Separator flex="1" />
			</HStack>
			<Stack>
				<Avatar.Root w="100px" h="100px">
					<Avatar.Fallback name={user.nickname} />
					<Avatar.Image src={user.avatar_link} />
				</Avatar.Root>
				<DataList.Root orientation="horizontal">
					<DataList.Item key="nickname">
						<DataList.ItemLabel minW="150px">
							Имя пользователя
						</DataList.ItemLabel>
						<DataList.ItemValue color="black" fontWeight="500">
							<p>{user.nickname}</p>
						</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item key="about_me">
						<DataList.ItemLabel minW="150px">О себе</DataList.ItemLabel>
						<DataList.ItemValue color="black" fontWeight="500">
							<p>{user.about_me}</p>
						</DataList.ItemValue>
					</DataList.Item>
				</DataList.Root>
			</Stack>

			{/* Контактная информация */}
			<HStack py={6}>
				<Heading size="xl" flexShrink="0">
					Контактная информация
				</Heading>
				<Separator flex="1" />
			</HStack>
			<Stack>
				<DataList.Root orientation="horizontal">
					<DataList.Item key="email">
						<DataList.ItemLabel minW="150px">
							Электронная почта
						</DataList.ItemLabel>
						<DataList.ItemValue color="black" fontWeight="500">
							<p>{user.email}</p>
						</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item key="region">
						<DataList.ItemLabel minW="150px">Регион</DataList.ItemLabel>
						<DataList.ItemValue color="black" fontWeight="500">
							<p>{user.region || NOT_SET}</p>
						</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item key="city">
						<DataList.ItemLabel minW="150px">Город</DataList.ItemLabel>
						<DataList.ItemValue color="black" fontWeight="500">
							<p>{user.city || NOT_SET}</p>
						</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item key="timezone">
						<DataList.ItemLabel minW="150px">
							Часовой пояс
						</DataList.ItemLabel>
						<DataList.ItemValue color="black" fontWeight="500">
							<p>{timeZone}</p>
						</DataList.ItemValue>
					</DataList.Item>
				</DataList.Root>
			</Stack>

			<Button type="button" mt={6} onClick={() => navigate("/profile/edit")}>
				Редактировать
			</Button>
		</>
	);
};
