import { BrowserRouter, Route, Routes } from "react-router";

import {
  AccountPage,
  CreateEventPage,
  CreatePlacePage,
  EditEventPage,
  EventAttendeesPage,
  EventsDetailsPage,
  EventsListPage,
  HomePage,
  LoginPage,
  ManageLocalprovidersPage,
  ManagePage,
  ManagePlacesPage,
  ManageStaffPage,
  ManageVerifiedShamansPage,
  MapPage,
  NotificationsPage,
  Page404,
  PurchasePage,
  RequestPlacePage,
  ShamanVerificationPage,
  SocialsPage,
  UpdatePlacePage,
} from "@/pages";
import { NavContainer } from "@/shared/widgets/layout/NavContainer";
import { AuthProvider, GoogleMapsProvider, QueryProvider } from "../providers";
import { ProtectedRoute } from "../providers/authProvider/ui/ProtectedRoute";
import { RestrictedTo } from "../providers/restrictToProvider/RestrictedTo";

export const Router = () => {
  return (
    <BrowserRouter>
      <QueryProvider>
        <GoogleMapsProvider>
          <Routes>
            <Route element={<AuthProvider />}>
              <Route element={<NavContainer />}>
                <Route path="/" index element={<HomePage />} />
                <Route path="/map" element={<MapPage />} />

                <Route path="/events">
                  <Route index element={<EventsListPage />} />
                  <Route
                    path="/events/:eventId"
                    element={<EventsDetailsPage />}
                  />
                  <Route
                    path="/events/:eventId/attendees"
                    element={<EventAttendeesPage />}
                  />
                  <Route element={<ProtectedRoute />}>
                    <Route
                      path="/events/:eventId/edit"
                      element={<EditEventPage />}
                    />
                    <Route
                      path="/events/create"
                      element={<CreateEventPage />}
                    />
                  </Route>
                </Route>

                <Route element={<ProtectedRoute />}>
                  <Route
                    path="/request-place"
                    element={<RestrictedTo userRoles={["verifiedshaman"]} />}
                  >
                    <Route index element={<RequestPlacePage />} />
                  </Route>
                  <Route
                    path="/manage"
                    element={
                      <RestrictedTo
                        userRoles={[
                          "master",
                          "localprovider",
                          "verifiedshaman",
                        ]}
                      />
                    }
                  >
                    <Route index element={<ManagePage />} />
                    <Route
                      path="/manage/place"
                      element={<RestrictedTo userRoles={["localprovider"]} />}
                    >
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
                    <Route
                      path="/manage/staff"
                      element={<RestrictedTo userRoles={["localprovider"]} />}
                    >
                      <Route index element={<ManageStaffPage />} />
                    </Route>
                    <Route
                      path="/manage/localproviders"
                      element={<RestrictedTo userRoles={["master"]} />}
                    >
                      <Route index element={<ManageLocalprovidersPage />} />
                    </Route>
                    <Route
                      path="/manage/verifiedshamans"
                      element={<RestrictedTo userRoles={["localprovider"]} />}
                    >
                      <Route index element={<ManageVerifiedShamansPage />} />
                    </Route>
                  </Route>

                  <Route
                    path="/notifications"
                    element={<NotificationsPage />}
                  />
                  <Route path="/account">
                    <Route index element={<AccountPage />} />
                  </Route>
                </Route>
                <Route path="/purchase" element={<PurchasePage />} />
                <Route path="/socials" element={<SocialsPage />} />
              </Route>
              <Route path="verify" element={<ShamanVerificationPage />} />
            </Route>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Page404 />} />
          </Routes>
        </GoogleMapsProvider>
      </QueryProvider>
    </BrowserRouter>
  );
};
