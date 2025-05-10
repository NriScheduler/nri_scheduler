import { h, render } from "preact";
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
import { LazyPage } from "./lazy-page";

const SingUpPage = LazyPage(() => import("./components/pages/sign-up/signup"));
const CalendarPage = LazyPage(() => import("./components/pages/calendar/calendar")); // eslint-disable-line prettier/prettier
const ProfilePage = LazyPage(() => import("./components/pages/profile/profile")); // eslint-disable-line prettier/prettier
const ShortProfilePage = LazyPage(() => import("./components/pages/profile/short-profile")); // eslint-disable-line prettier/prettier
const ProfileEdit = LazyPage(() => import("./components/pages/profile/profile-edit")); // eslint-disable-line prettier/prettier
const VerificationPage = LazyPage(() => import("./components/pages/verification/verification")); // eslint-disable-line prettier/prettier
const RegionsPage = LazyPage(() => import("./components/pages/regions/regions")); // eslint-disable-line prettier/prettier

const App = () => (
	<Layout>
		<Router>
			<Route path="/" component={HomePage} />
			<Route path="/signup" component={SingUpPage} />
			<Route path="/signin" component={SignInPage} />
			<Route path="/calendar" component={CalendarPage} />
			<Route path="/event/:id" component={EventPage} />
			<Route path="/company/:id" component={CompanyPage} />
			<Route path="/location/:id" component={LocationPage} />
			<Route path="/profile" component={ProfilePage} />
			<Route path="/profile/:id" component={ShortProfilePage} />
			<Route path="/profile/edit" component={ProfileEdit} />
			<Route path="/verification" component={VerificationPage} />
			<Route path="/regions" component={RegionsPage} />
			<Route default component={() => <NotFoundPage />} />
		</Router>
	</Layout>
);

softCheck();

render(<App />, document.body);
