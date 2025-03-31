import { h } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";
import { route as navigate } from "preact-router";

import { Button, Card, Container, Grid, Link, Tabs } from "@chakra-ui/react";
import { useStore } from "@nanostores/preact";

import { CampList } from "./camplist/camplist";
import { EmptyList } from "./empty-list";
import { ProfileInfo } from "./profile-info";
import { IApiCompany, readMyCompanies } from "../../../api";
import { $profile } from "../../../store/profile";
import { $activeTab, setActiveTab } from "../../../store/tabsStore";

/** @todo сделать апишку для заявок */
interface IEvent {
	label?: string;
	value?: string;
	href?: string;
}

export const tabList = [
	{ id: "user", label: "Профиль" },
	{ id: "events", label: "Заявки" },
	{ id: "camplist", label: "Кампания" },
	{ id: "resetpass", label: "Сброс пароля" },
];

export const ProfilePage = () => {
	const user = useStore($profile);
	if (!user?.signed) {
		navigate("/signin");
		return;
	}

	const events: IEvent[] = [];

	const [campList, setCampList] = useState<IApiCompany[]>([]);
	const activeTab = useStore($activeTab);

	const getCampList = useCallback(async () => {
		const responce = await readMyCompanies();
		const payload = responce?.payload || null;
		if (payload) {
			setCampList(payload);
		}
		return payload;
	}, []);

	useEffect(() => {
		getCampList();
	}, [getCampList]);

	return (
		<Container mb={6}>
			<Tabs.Root
				defaultValue="user"
				variant="outline"
				value={activeTab}
				onValueChange={(e) => setActiveTab(e.value)}
			>
				<Tabs.List>
					{tabList.map((tab) => (
						<Tabs.Trigger key={tab.id} value={tab.id}>
							{tab.label}
						</Tabs.Trigger>
					))}
				</Tabs.List>

				<Tabs.Content value="user" maxW="2xl">
					<ProfileInfo user={user} />
				</Tabs.Content>

				<Tabs.Content value="events">
					{events.length !== 0 ? (
						events.map((item, index) => (
							<Grid templateColumns="repeat(4, 1fr)" gap="4" key={index}>
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
						<EmptyList
							title="Заявок на подтверждение нет"
							description="Как только... так сразу"
						/>
					)}
				</Tabs.Content>

				<Tabs.Content value="camplist">
					{campList.length > 0 ? (
						<CampList list={campList} />
					) : (
						<EmptyList title="Кампаний не создано" />
					)}
				</Tabs.Content>

				<Tabs.Content value="resetpass">resetpass</Tabs.Content>
			</Tabs.Root>
		</Container>
	);
};
