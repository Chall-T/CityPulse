import { Routes, Route, Navigate } from 'react-router-dom';
import { PrivateOnlyRoute, PublicOnlyRoute, RoleRoute } from './providers/AuthProvider';
import { useEffect } from "react";
import { cleanAllExpiredCaches } from "./utils/cleanupExpiredCache";
import { useAuthStore } from './store/authStore';

import Layout from './components/Layout';

import EventDetailPage from './pages/DetailedEventPage';
import EventPage from './pages/EventsPage';
import EventMapPage from './pages/EventsMapPage';
import CreateEventPage from './pages/CreateEventPage';
import EditEventPage from './pages/EditEventPage';

import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegisterPage';
import EmailVerificationPage from './pages/EmailVerivicationPage';
import UserProfilePage from './pages/UserProfilePage';

import AdminPanelPage from './pages/admin/AdminPanelPage';
import ModeratorPanelPage from './pages/admin/ModeratorPanelPage';

import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});


const App = () => {
  const user = useAuthStore(state => state.user);
  useEffect(() => {
    cleanAllExpiredCaches();
  }, []);
  return (
    <div className="app">
      <Layout user={user}>
        <Routes>

          <Route path="/login" element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>} />
          <Route path="/register" element={
            <PublicOnlyRoute>
              <RegistrationPage />
            </PublicOnlyRoute>} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/profile/me" element={
            <PrivateOnlyRoute>
              <UserProfilePage />
            </PrivateOnlyRoute>}
          />
          <Route path="/events" element={<EventPage />} />
          <Route path="/events/map" element={<EventMapPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/events/:eventId/edit" element={
            <PrivateOnlyRoute>
              <EditEventPage />
            </PrivateOnlyRoute>}
          />
          <Route path="/events/create" element={
            <PrivateOnlyRoute>
              <CreateEventPage />
            </PrivateOnlyRoute>}
          />
          <Route path='/' element={<Navigate to="/events" replace />} />

          <Route path="/admin" element={
            <PrivateOnlyRoute>
              <RoleRoute allowedRoles={['ADMIN']}>
                <AdminPanelPage />
              </RoleRoute>
            </PrivateOnlyRoute>
          } />

          <Route path="/moderator" element={
            <PrivateOnlyRoute>
              <RoleRoute allowedRoles={['MODERATOR', 'ADMIN']}>
                <ModeratorPanelPage />
              </RoleRoute>
            </PrivateOnlyRoute>
          } />

        </Routes>
      </Layout>
    </div>
  );
};

export default App;