import { BrowserRouter, Route, Routes } from "react-router";

import {
  AccountPage,
  AssignStaffPage,
  CreateEventPage,
  CreatePlacePage,
  EditEventPage,
  EventsDetailsPage,
  EventsListPage,
  HomePage,
  LoginPage,
  ManagePage,
  MyEventsPage,
  NotificationsPage,
  PurchasePage,
  SocialsPage,
} from "@/pages";
import { NavContainer } from "@/shared/widgets/layout/NavContainer";
import { QueryProvider } from "../providers";
import { AuthProvider } from "../providers";

export const Router = () => {
  return (
    <BrowserRouter>
      <QueryProvider>
        <Routes>
          <Route element={<AuthProvider />}>
            <Route element={<NavContainer />}>
              <Route path="/" index element={<HomePage />} />

              <Route path="/events">
                <Route index element={<EventsListPage />} />
                <Route
                  path="/events/:eventId"
                  element={<EventsDetailsPage />}
                />
                <Route
                  path="/events/:eventId/edit"
                  element={<EditEventPage />}
                />
                <Route path="/events/create" element={<CreateEventPage />} />
              </Route>

              <Route path="/manage">
                <Route index element={<ManagePage />} />
                <Route
                  path="/manage/create-place"
                  element={<CreatePlacePage />}
                />
                <Route
                  path="/manage/assign-staff"
                  element={<AssignStaffPage />}
                />
              </Route>

              <Route path="/notifications" element={<NotificationsPage />} />

              <Route path="/account">
                <Route index element={<AccountPage />} />
                <Route path="/account/my-events" element={<MyEventsPage />} />
              </Route>
            </Route>

            <Route path="/purchase" element={<PurchasePage />} />
            <Route path="/socials" element={<SocialsPage />} />
          </Route>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </QueryProvider>
    </BrowserRouter>
  );
};
