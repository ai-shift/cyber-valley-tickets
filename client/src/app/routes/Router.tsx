import { BrowserRouter, Routes, Route } from "react-router";

export const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" index />
      </Routes>
    </BrowserRouter>
  );
};
