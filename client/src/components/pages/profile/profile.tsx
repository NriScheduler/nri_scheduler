import { h } from "preact";
import { useEffect, useState } from "preact/hooks";

import { Container, Tabs } from "@chakra-ui/react";
import { useStore } from "@nanostores/preact";

import { CompList } from "./complist/complist";
import { EventList } from "./eventlist";
import { PROFILE_TABS } from "./profile.data";
import { ProfileInfo } from "./profile-info";
import { EAbortReason, IApiCompany, readMyCompanies } from "../../../api";
import { $checkboxState, toggleCheckbox } from "../../../store/checkboxStore";
import { fetchEvents } from "../../../store/eventList";
import { $activeTab, setActiveTab } from "../../../store/tabsStore";
import { useAuthVerification } from "../../../utils";

export const ProfilePage = () => {
	const { profile, isAuthenticated } = useAuthVerification();

	if (!isAuthenticated) {
		return null;
	}

	const [compList, setCompList] = useState<readonly IApiCompany[]>([]);
	const [isFetching, setIsFetching] = useState(false);

	//STORE HOOKS
	const activeTab = useStore($activeTab);
	const { eventsType, eventsView, companyView } = useStore($checkboxState);
	//TAB CONSTANTS
	const [USER_TAB, EVENTS_TAB, COMPLIST_TAB, RESETPASS_TAB] = PROFILE_TABS;

	const fetchEventsData = async () => {
		await fetchEvents({
			type: "profile",
			youAreMaster: !eventsType,
		});
	};

	const fetchCompaniesData = async (abortController?: AbortController) => {
		setIsFetching(true);

		const response = await readMyCompanies(null, abortController);
		if (response?.payload) {
			setCompList(response.payload);
		}

		setIsFetching(false);
	};

	const fetchData = async (abortController?: AbortController) => {
		try {
			switch (activeTab) {
				case EVENTS_TAB.id:
					await fetchEventsData();
					break;
				case COMPLIST_TAB.id:
					await fetchCompaniesData(abortController);
					break;
			}
		} catch (error) {
			console.error("Fetch error: ", error);
		}
	};

	useEffect(() => {
		const abortController = new AbortController();
		fetchData(abortController);

		return () => {
			abortController.abort(EAbortReason.UNMOUNT);
		};
	}, [activeTab, eventsType]);

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
						layoutMode={eventsView}
						toggleCheckbox={() => toggleCheckbox("eventsType")}
						onLayoutToggle={() => toggleCheckbox("eventsView")}
					/>
				</Tabs.Content>

				<Tabs.Content value={COMPLIST_TAB.id}>
					<CompList
						list={compList}
						isChecked={companyView}
						toggleCheckbox={() => toggleCheckbox("companyView")}
						isLoading={isFetching}
					/>
				</Tabs.Content>

				<Tabs.Content value={RESETPASS_TAB.id}>resetpass</Tabs.Content>
			</Tabs.Root>
		</Container>
	);
};

export default ProfilePage;
