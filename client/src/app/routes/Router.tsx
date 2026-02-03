import { BrowserRouter, Route, Routes } from "react-router";

import { useReferralFromUrl } from "@/features/referral";
import {
  AccountPage,
  CreateDistributionProfilePage,
  CreateEventPage,
  CreatePlacePage,
  CreatePlaceUnifiedPage,
  EditEventPage,
  EventAttendeesPage,
  EventsDetailsPage,
  EventsListPage,
  HomePage,
  LoginPage,
  ManageLocalprovidersPage,
  ManagePlacesPage,
  ManageStaffPage,
  ManageVerificationStatsPage,
  ManageVerifiedShamansPage,
  MapPage,
  NotificationsPage,
  Page404,
  PurchasePage,
  ShamanVerificationPage,
  SocialsPage,
  TxHashPlaceholderPage,
  UpdatePlacePage,
  UserPage,
} from "@/pages";
import { NavContainer } from "@/shared/widgets/layout/NavContainer";
import { AuthProvider, GoogleMapsProvider, QueryProvider } from "../providers";
import { ProtectedRoute } from "../providers/authProvider/ui/ProtectedRoute";
import { RestrictedTo } from "../providers/restrictToProvider/RestrictedTo";

const ReferralHandler = () => {
  useReferralFromUrl();
  return null;
};

export const Router = () => {
  return (
    <BrowserRouter>
      <QueryProvider>
        <GoogleMapsProvider>
          <ReferralHandler />
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
                  </Route>
                  <Route path="/events/create" element={<CreateEventPage />} />
                </Route>

                <Route
                  path="/place/create"
                  element={<CreatePlaceUnifiedPage />}
                />

                <Route element={<ProtectedRoute />}>
                  <Route
                    path="/manage/place"
                    element={<RestrictedTo view="manage-places" />}
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
                    element={<RestrictedTo view="manage-staff" />}
                  >
                    <Route index element={<ManageStaffPage />} />
                  </Route>
                  <Route
                    path="/manage/localproviders"
                    element={<RestrictedTo view="manage-localproviders" />}
                  >
                    <Route index element={<ManageLocalprovidersPage />} />
                  </Route>
                  <Route
                    path="/manage/verifiedshamans"
                    element={<RestrictedTo view="manage-verifiedshamans" />}
                  >
                    <Route index element={<ManageVerifiedShamansPage />} />
                  </Route>
                  <Route
                    path="/manage/verification-stats"
                    element={<RestrictedTo view="manage-verification-stats" />}
                  >
                    <Route index element={<ManageVerificationStatsPage />} />
                  </Route>
                  <Route
                    path="/notifications"
                    element={<NotificationsPage />}
                  />
                  <Route path="/account">
                    <Route index element={<AccountPage />} />
                    <Route
                      path="/account/distribution-profiles/create"
                      element={<CreateDistributionProfilePage />}
                    />
                  </Route>
                </Route>
                <Route path="/purchase" element={<PurchasePage />} />
                <Route
                  path="/txhash/:txHash"
                  element={<TxHashPlaceholderPage />}
                />
                <Route path="/socials" element={<SocialsPage />} />
                <Route path="/user/:address" element={<UserPage />} />
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
