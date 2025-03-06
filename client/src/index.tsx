import { h, render } from "preact"; // eslint-disable-line
import { Router, Route } from "preact-router";
import AsyncRoute from "preact-async-route";

import { Layout } from "./components/layout";
import {
	CreateEventPage,
	EventPage,
	HomePage,
	MasteryPage,
	NotFoundPage,
	ProfilePage,
	SignInPage,
} from "./components/pages";

const App = () => (
	<Layout
		page={
			<Router>
				<Route path="/" component={HomePage} />
				<AsyncRoute
					path="/signup"
					getComponent={() =>
						import("./components/pages/sign-up/signup").then(
							(module) => module.SingUpPage
						)
					}
				/>
				<Route path="/signin" component={SignInPage} />
				<AsyncRoute
					path="/calendar"
					getComponent={() =>
						import("./components/pages/calendar/calendar").then(
							(module) => module.CalendarPage
						)
					}
				/>
				<Route path="/event/create" component={CreateEventPage} />
				<Route path="/event/:id" component={EventPage} />
				<Route path="/mastery" component={MasteryPage} />
				<Route path="/profile" component={ProfilePage} />

				<Route default component={() => <NotFoundPage />} />
			</Router>
		}
	/>
);

render(<App />, document.body);
