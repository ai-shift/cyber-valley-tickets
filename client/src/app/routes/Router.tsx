import { BrowserRouter, Route, Routes } from "react-router";

import {
  EventsList,
  Home,
  CreateEvent,
  EventsDetails,
  Notifications,
} from "@/pages";

export const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" index element={<Home />} />

        <Route path="/events">
          <Route index element={<EventsList />} />
          <Route path="/events/:eventId" element={<EventsDetails />} />
          <Route path="/events/create" element={<CreateEvent />} />
        </Route>
        <Route path="/notifications" element={<Notifications />} />

        <Route path="/profile" />
      </Routes>
    </BrowserRouter>
  );
};
