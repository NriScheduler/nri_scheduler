import { Fragment, h } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";
import { route as navigate } from "preact-router";

import {
	Button,
	DataList,
	Heading,
	HStack,
	Separator,
	Stack,
} from "@chakra-ui/react";
import { useStore } from "@nanostores/preact";

import { Avatar } from "../../ui/avatar";
import { HoverCard } from "../../ui/hover-card";
import { Check, Warning } from "../../ui/icons";
import { toaster } from "../../ui/toaster";
import { sendVerificationLink } from "../../../api";
import { $avatarLink, IStorePrifile, TIMEZONES } from "../../../store/profile";

const NOT_SET = "Не установлен";

interface IProfileInfoProps {
	readonly user: IStorePrifile | null;
}

export const ProfileInfo = ({ user }: IProfileInfoProps) => {
	const [timeZone, setTimeZone] = useState(NOT_SET);
	const [fetching, setFetching] = useState(false);
	const [verificationSent, setVerificationSent] = useState(false);

	const avatarLink = useStore($avatarLink);

	useEffect(() => {
		setTimeZone(
			user?.timezone_offset || user?.timezone_offset === 0
				? `UTC ${user.timezone_offset >= 0 ? "+" : ""}${user.timezone_offset} (${TIMEZONES.get(user.timezone_offset)})`
				: NOT_SET,
		);
	}, [user?.timezone_offset]);

	const sendVerification = useCallback(() => {
		setFetching(true);
		sendVerificationLink().then((res) => {
			if (!res) {
				setFetching(false);
				return;
			}

			toaster.success({
				title: "Вам отправлена ссылка для подтверждения email",
			});
			setVerificationSent(true);
		});
	}, []);

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
				<Avatar
					src={avatarLink?.link}
					fallback={user?.nickname}
					w="100px"
					h="100px"
				/>
				<DataList.Root orientation="horizontal">
					<DataList.Item key="nickname">
						<DataList.ItemLabel minW="150px">
							Имя пользователя
						</DataList.ItemLabel>
						<DataList.ItemValue color="black" fontWeight="500">
							<p>{user?.nickname}</p>
						</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item key="about_me">
						<DataList.ItemLabel minW="150px">О себе</DataList.ItemLabel>
						<DataList.ItemValue color="black" fontWeight="500">
							<p>{user?.about_me}</p>
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
							<HStack>
								{user?.email || NOT_SET + "а"}
								{user?.email && (
									<HoverCard
										content={`Электронная почта ${user.email_verified ? "" : "не "}подтверждена`}
									>
										{user.email_verified ? <Check /> : <Warning />}
									</HoverCard>
								)}
								{user?.email &&
									!user?.email_verified &&
									!verificationSent && (
										<Button
											type="button"
											size="xs"
											variant="surface"
											colorPalette="blue"
											disabled={fetching}
											onClick={sendVerification}
										>
											Подтвердить email
										</Button>
									)}
							</HStack>
						</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item key="region">
						<DataList.ItemLabel minW="150px">Регион</DataList.ItemLabel>
						<DataList.ItemValue color="black" fontWeight="500">
							<p>{user?.region || NOT_SET}</p>
						</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item key="city">
						<DataList.ItemLabel minW="150px">Город</DataList.ItemLabel>
						<DataList.ItemValue color="black" fontWeight="500">
							<p>{user?.city || NOT_SET}</p>
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
