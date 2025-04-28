import { BrowserRouter, Route, Routes } from "react-router";

import { Home } from "@/pages";

export const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" index element={<Home />} />

        <Route path="/events">
          <Route index />
          <Route path="/events/:eventId" />
          <Route path="/events/create" />
        </Route>

        <Route path="/profile" />
      </Routes>
    </BrowserRouter>
  );
};
