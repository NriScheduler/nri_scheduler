import { h } from "preact";
import { useEffect, useState } from "preact/hooks";

import { Container, Spinner, Tabs } from "@chakra-ui/react";
import { useStore } from "@nanostores/preact";

import { CompList } from "./complist/complist";
import { EmptyList } from "./empty-list";
import { EventList } from "./eventlist";
import { PROFILE_TABS, PROFILE_TEXTS } from "./profile.data";
import { ProfileInfo } from "./profile-info";
import {
	IApiCompany,
	IMasterApp,
	IPlayerApp,
	readMasterAppsList,
	readMyCompanies,
	readPlayerAppsList,
} from "../../../api";
import { $checkboxState, toggleCheckbox } from "../../../store/checkboxStore";
import { $activeTab, setActiveTab } from "../../../store/tabsStore";
import { useAuthVerification } from "../../../utils";

export const ProfilePage = () => {
	const { profile, isAuthenticated } = useAuthVerification();

	const [state, setState] = useState({
		compList: [] as ReadonlyArray<IApiCompany>,
		playerAppList: [] as IPlayerApp[],
		masterAppList: [] as IMasterApp[],
		fetching: false,
		eventsView: false,
		eventsType: false,
		companyView: false,
	});

	const activeTab = useStore($activeTab);
	const { eventsType, eventsView, companyView } = useStore($checkboxState);

	const [USER_TAB, EVENTS_TAB, COMPLIST_TAB, RESETPASS_TAB] = PROFILE_TABS;

	const fetchData = async () => {
		setState((prev) => ({ ...prev, fetching: true }));

		try {
			if (activeTab === EVENTS_TAB.id) {
				const response = await (eventsType
					? readPlayerAppsList()
					: readMasterAppsList());
				if (response?.payload) {
					const update = eventsType
						? { playerAppList: response.payload as IPlayerApp[] }
						: { masterAppList: response.payload as IMasterApp[] };
					setState((prev) => ({ ...prev, ...update }));
				}
			} else if (activeTab === COMPLIST_TAB.id) {
				const abortController = new AbortController();
				const response = await readMyCompanies(null, abortController);
				if (response?.payload) {
					setState((prev) => ({ ...prev, compList: response.payload }));
				}
			}
		} finally {
			setState((prev) => ({ ...prev, fetching: false }));
		}
	};

	useEffect(() => {
		let abortController = new AbortController();
		let isMounted = true;

		(async () => {
			try {
				await fetchData();
			} catch (err) {
				if (isMounted) {
					console.error("Ошибка:", err);
				}
			}
		})();

		return () => {
			isMounted = false;
			abortController.abort();
		};
	}, [activeTab, eventsType]);

	if (!isAuthenticated) {
		return null;
	}

	const { compList, playerAppList, masterAppList, fetching } = state;

	return (
		<Container mb={6}>
			<Tabs.Root
				defaultValue="user"
				variant="outline"
				value={activeTab}
				onValueChange={(e) => setActiveTab(e.value)}
			>
				<Tabs.List>
					{PROFILE_TABS.map(({ id, label }) => (
						<Tabs.Trigger key={id} value={id}>
							{label}
						</Tabs.Trigger>
					))}
				</Tabs.List>

				<Tabs.Content value={USER_TAB.id} maxW="2xl">
					<ProfileInfo user={profile} />
				</Tabs.Content>

				<Tabs.Content value={EVENTS_TAB.id}>
					<EventList
						isChecked={eventsType}
						toggleCheckbox={() => toggleCheckbox("eventsType")}
						layoutMode={eventsView}
						onLayoutToggle={() => toggleCheckbox("eventsView")}
						playerAppList={playerAppList}
						masterAppList={masterAppList}
						onUpdate={fetchData}
					/>
				</Tabs.Content>

				<Tabs.Content value={COMPLIST_TAB.id}>
					{fetching ? (
						<Spinner size="sm" />
					) : compList.length > 0 ? (
						<CompList
							list={compList}
							isChecked={companyView}
							toggleCheckbox={() => toggleCheckbox("companyView")}
						/>
					) : (
						<EmptyList
							title={PROFILE_TEXTS.emptyStates.companies.title}
						/>
					)}
				</Tabs.Content>

				<Tabs.Content value={RESETPASS_TAB.id}>resetpass</Tabs.Content>
			</Tabs.Root>
		</Container>
	);
};

export default ProfilePage;
