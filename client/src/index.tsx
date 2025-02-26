import "purecss/build/pure.css";
import "./index.css";

import { h, render } from "preact";
import { Router, Route } from "preact-router";
import AsyncRoute from "preact-async-route";

import { Layout } from "./components/layout";

import { SignInPage } from "./components/pages/sign_in";
import { CreateEventPage } from "./components/pages/event/create_event";
import { EventPage } from "./components/pages/event/event";
import { MasteryPage } from "./components/pages/mastery";

const App = () => (
	<Layout
		page={
			<Router>
				<AsyncRoute
					path="/"
					getComponent={() =>
						import("./components/pages/registration").then(
							(module) => module.RegistrationPage
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
				<Route
					default
					component={() => <h1>404 - Страница не найдена</h1>}
				/>
			</Router>
		}
	/>
);

render(<App />, document.body);
