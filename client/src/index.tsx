import { h, render } from "preact";
import { lazy } from "preact/compat";
import { Route, Router } from "preact-router";

import { softCheck } from "./api";
import { Layout } from "./components/layout";
import {
	CompanyPage,
	EventPage,
	HomePage,
	LocationPage,
	NotFoundPage,
	SignInPage,
} from "./components/pages";

const SingUpPage = lazy(() => import("./components/pages/sign-up/signup"));
const CalendarPage = lazy(() => import("./components/pages/calendar/calendar"));
const ProfilePage = lazy(() => import("./components/pages/profile/profile"));
const ProfileEdit = lazy(
	() => import("./components/pages/profile/profile-edit"),
);
const VerificationPage = lazy(
	() => import("./components/pages/verification/verification"),
);
const RegionsPage = lazy(() => import("./components/pages/regions/regions"));

const App = () => (
	<Layout
		page={
			<Router>
				<Route path="/" component={HomePage} />
				<Route path="/signup" component={SingUpPage} />
				<Route path="/signin" component={SignInPage} />
				<Route path="/calendar" component={CalendarPage} />
				<Route path="/event/:id" component={EventPage} />
				<Route path="/company/:id" component={CompanyPage} />
				<Route path="/location/:id" component={LocationPage} />
				<Route path="/profile" component={ProfilePage} />
				<Route path="/profile/edit" component={ProfileEdit} />
				<Route path="/verification" component={VerificationPage} />
				<Route path="/regions" component={RegionsPage} />
				<Route default component={() => <NotFoundPage />} />
			</Router>
		}
	/>
);

softCheck();

render(<App />, document.body);
