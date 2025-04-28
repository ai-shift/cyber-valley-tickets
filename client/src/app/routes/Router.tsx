import { BrowserRouter, Route, Routes } from "react-router";

export const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" index />
      </Routes>
    </BrowserRouter>
  );
};
