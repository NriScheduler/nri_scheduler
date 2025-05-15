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
	EAbortReason,
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
		companyView: false,
	});

	const activeTab = useStore($activeTab);
	const { eventsView, companyView } = useStore($checkboxState);

	const [USER_TAB, EVENTS_TAB, COMPLIST_TAB, RESETPASS_TAB] = PROFILE_TABS;

	useEffect(() => {
		let isMounted = true;
		let abortController: AbortController | null = null;

		const fetchData = async () => {
			setState((prev) => ({ ...prev, fetching: true }));

			try {
				if (activeTab === EVENTS_TAB.id) {
					const response = await (eventsView
						? readPlayerAppsList()
						: readMasterAppsList());
					if (isMounted && response?.payload) {
						const update = eventsView
							? { playerAppList: response.payload as IPlayerApp[] }
							: { masterAppList: response.payload as IMasterApp[] };
						setState((prev) => ({ ...prev, ...update }));
					}
				} else if (activeTab === COMPLIST_TAB.id) {
					abortController = new AbortController();
					const response = await readMyCompanies(null, abortController);
					if (isMounted && response?.payload) {
						setState((prev) => ({ ...prev, compList: response.payload }));
					}
				}
			} finally {
				if (isMounted) {
					setState((prev) => ({ ...prev, fetching: false }));
				}
			}
		};

		fetchData();

		return () => {
			isMounted = false;
			abortController?.abort(EAbortReason.UNMOUNT);
		};
	}, [activeTab, eventsView]);

	if (!isAuthenticated) {
		return null;
	}

	const { compList, playerAppList, masterAppList, fetching } = state;

	// const handleUpdate = async () => {}

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
						isChecked={eventsView}
						toggleCheckbox={() => toggleCheckbox("eventsView")}
						playerAppList={playerAppList}
						masterAppList={masterAppList}
						// onUpdate={handleUpdate}
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
