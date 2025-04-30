import { lazy } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

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

const CalendarPage = lazy(() => import("./components/pages/calendar/calendar"));
const ProfilePage = lazy(() => import("./components/pages/profile/profile"));
const ProfileEdit = lazy(
	() => import("./components/pages/profile/profile-edit"),
);
const RegionsPage = lazy(() => import("./components/pages/regions/regions"));
const SingUpPage = lazy(() => import("./components/pages/sign-up/signup"));
const VerificationPage = lazy(
	() => import("./components/pages/verification/verification"),
);

const router = createBrowserRouter([
	{ path: "/", element: <HomePage /> },
	{ path: "/signup", element: <SingUpPage /> },
	{ path: "/signin", element: <SignInPage /> },
	{ path: "/calendar", element: <CalendarPage /> },
	{ path: "/event/:id", element: <EventPage /> },
	{ path: "/company/:id", element: <CompanyPage /> },
	{ path: "/location/:id", element: <LocationPage /> },
	{ path: "/profile", element: <ProfilePage /> },
	{ path: "/profile/edit", element: <ProfileEdit /> },
	{ path: "/verification", element: <VerificationPage /> },
	{ path: "/regions", element: <RegionsPage /> },
	{ path: "*", element: <NotFoundPage /> },
]);

const App = () => <Layout page={<RouterProvider router={router} />} />;

softCheck();

const root = createRoot(document.body);
root.render(<App />);
