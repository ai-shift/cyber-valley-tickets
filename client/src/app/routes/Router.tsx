import { BrowserRouter, Route, Routes } from "react-router";

import {
  CreateEventPage,
  EventsDetailsPage,
  EventsListPage,
  HomePage,
  ManagePage,
  NotificationsPage,
  PurchasePage,
  SocialsPage,
  EditEventPage,
  CreatePlacePage,
  AssignStaffPage,
  AccountPage,
  MyEventsPage,
} from "@/pages";

export const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" index element={<HomePage />} />

        <Route path="/events">
          <Route index element={<EventsListPage />} />
          <Route path="/events/:eventId" element={<EventsDetailsPage />} />
          <Route path="/events/:eventId/edit" element={<EditEventPage />} />
          <Route path="/events/create" element={<CreateEventPage />} />
        </Route>

        <Route path="/manage">
          <Route index element={<ManagePage />} />
          <Route path="/manage/create-place" element={<CreatePlacePage />} />
          <Route path="/manage/assign-staff" element={<AssignStaffPage />} />
        </Route>

        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/purchase" element={<PurchasePage />} />
        <Route path="/socials" element={<SocialsPage />} />

        <Route path="/account">
          <Route index element={<AccountPage />} />
          <Route path="/account/my-events" element={<MyEventsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
