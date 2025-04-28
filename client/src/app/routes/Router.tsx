import { BrowserRouter, Route, Routes } from "react-router";

export const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" index />

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
