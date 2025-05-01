import { BrowserRouter, Route, Routes } from "react-router";

import {
  EventsListPage,
  HomePage,
  CreateEventPage,
  EventsDetailsPage,
  Notifications,
  ManagePage,
  PurchasePage,
} from "@/pages";

export const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" index element={<HomePage />} />

        <Route path="/events">
          <Route index element={<EventsListPage />} />
          <Route path="/events/:eventId" element={<EventsDetailsPage />} />
          <Route path="/events/create" element={<CreateEventPage />} />
        </Route>

        <Route path="/notifications" element={<Notifications />} />
        <Route path="/manage" element={<ManagePage />} />
        <Route path="/purchase" element={<PurchasePage />} />

        <Route path="/profile" />
      </Routes>
    </BrowserRouter>
  );
};
