import { h, render } from "preact";
import AsyncRoute from "preact-async-route";
import { Route, Router } from "preact-router";

import { softCheck } from "./api";
import { Layout } from "./components/layout";
import {
	CompanyPage,
	EventPage,
	HomePage,
	LocationPage,
	NotFoundPage,
	ProfilePage,
	SignInPage,
} from "./components/pages";
import { ProfileEdit } from "./components/pages/profile/profile-edit";

const App = () => (
	<Layout
		page={
			<Router>
				<Route path="/" component={HomePage} />
				<AsyncRoute
					path="/signup"
					getComponent={() =>
						import("./components/pages/sign-up/signup").then(
							(module) => module.SingUpPage,
						)
					}
				/>
				<Route path="/signin" component={SignInPage} />
				<AsyncRoute
					path="/calendar"
					getComponent={() =>
						import("./components/pages/calendar/calendar").then(
							(module) => module.CalendarPage,
						)
					}
				/>
				<Route path="/event/:id" component={EventPage} />
				<Route path="/company/:id" component={CompanyPage} />
				<Route path="/location/:id" component={LocationPage} />
				<Route path="/profile" component={ProfilePage} />
				<Route path="/profile/edit" component={ProfileEdit} />

				<Route default component={() => <NotFoundPage />} />
			</Router>
		}
	/>
);

softCheck();

render(<App />, document.body);
