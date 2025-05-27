import type { UUID } from "node:crypto";

import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { useRouter } from "preact-router";

import {
	Container,
	DataList,
	Heading,
	HStack,
	Separator,
	Skeleton,
	Stack,
} from "@chakra-ui/react";

import { Avatar } from "../../ui/avatar";
import { Check, Warning } from "../../ui/icons";
import {
	EAbortReason,
	getAnotherUserProfile,
	IApiShortProfile,
} from "../../../api";

const NOT_SET = "Не установлен";

const skeleton = <Skeleton w="30%" h="1.25rem" />;

export const ShortProfilePage = () => {
	const [route] = useRouter();
	const userId = route.matches?.id as UUID | undefined;
	if (!userId) {
		return;
	}

	const [user, setUser] = useState<IApiShortProfile | null>(null);
	const [fetching, setFetching] = useState(true);

	useEffect(() => {
		let isMounted = true;

		const abortController = new AbortController();

		getAnotherUserProfile(userId)
			.then((res) => {
				if (isMounted && res?.payload) {
					setUser(res.payload);
				}
			})
			.finally(() => setFetching(false));

		return () => {
			isMounted = false;
			abortController.abort(EAbortReason.UNMOUNT);
		};
	}, [userId]);

	return (
		<Container>
			{/* Персональная информация */}
			<HStack py={6}>
				<Heading size="xl" flexShrink="0">
					Персональная информация
				</Heading>
				<Separator flex="1" />
			</HStack>
			<Stack>
				<Avatar
					src={user?.avatar_link}
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
							{fetching ? skeleton : <p>{user?.nickname}</p>}
						</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item key="about_me">
						<DataList.ItemLabel minW="150px">О себе</DataList.ItemLabel>
						<DataList.ItemValue color="black" fontWeight="500">
							{fetching ? skeleton : <p>{user?.about}</p>}
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
					<DataList.Item key="verification">
						<DataList.ItemLabel minW="150px">
							Учётная запись
						</DataList.ItemLabel>
						<DataList.ItemValue color="black" fontWeight="500">
							{fetching ? (
								skeleton
							) : user?.verified ? (
								<HStack>
									<Check />
									Подтверждена
								</HStack>
							) : (
								<HStack>
									<Warning />
									Не подтверждена
								</HStack>
							)}
						</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item key="region">
						<DataList.ItemLabel minW="150px">Регион</DataList.ItemLabel>
						<DataList.ItemValue color="black" fontWeight="500">
							{fetching ? skeleton : <p>{user?.region || NOT_SET}</p>}
						</DataList.ItemValue>
					</DataList.Item>
					<DataList.Item key="city">
						<DataList.ItemLabel minW="150px">Город</DataList.ItemLabel>
						<DataList.ItemValue color="black" fontWeight="500">
							{fetching ? skeleton : <p>{user?.city || NOT_SET}</p>}
						</DataList.ItemValue>
					</DataList.Item>
				</DataList.Root>
			</Stack>
		</Container>
	);
};

export default ShortProfilePage;
