import { BrowserRouter, Route, Routes } from "react-router";

import {
  AccountPage,
  CreateEventPage,
  CreatePlacePage,
  EditEventPage,
  EventsDetailsPage,
  EventsListPage,
  HomePage,
  LoginPage,
  ManagePage,
  ManagePlacesPage,
  ManageStaffPage,
  NotificationsPage,
  Page404,
  PurchasePage,
  SocialsPage,
  UpdatePlacePage,
} from "@/pages";
import { NavContainer } from "@/shared/widgets/layout/NavContainer";
import { QueryProvider } from "../providers";
import { AuthProvider } from "../providers";
import { ProtectedRoute } from "../providers/authProvider/ui/ProtectedRoute";
import { RestrictedTo } from "../providers/restrictToProvider/RestrictedTo";

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
                <Route element={<ProtectedRoute />}>
                  <Route
                    path="/events/:eventId/edit"
                    element={<EditEventPage />}
                  />
                  <Route path="/events/create" element={<CreateEventPage />} />
                </Route>
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route
                  path="/manage"
                  element={<RestrictedTo userRole="master" />}
                >
                  <Route index element={<ManagePage />} />
                  <Route path="/manage/place">
                    <Route index element={<ManagePlacesPage />} />
                    <Route
                      path="/manage/place/create"
                      element={<CreatePlacePage />}
                    />
                    <Route
                      path="/manage/place/update"
                      element={<UpdatePlacePage />}
                    />
                  </Route>
                  <Route path="/manage/staff">
                    <Route index element={<ManageStaffPage />} />
                  </Route>
                </Route>

                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/account">
                  <Route index element={<AccountPage />} />
                </Route>
              </Route>
              <Route path="/purchase" element={<PurchasePage />} />
              <Route path="/socials" element={<SocialsPage />} />
            </Route>
          </Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Page404 />} />
        </Routes>
      </QueryProvider>
    </BrowserRouter>
  );
};
