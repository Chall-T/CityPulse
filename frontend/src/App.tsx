import { Routes, Route, Navigate } from 'react-router-dom';
import { PrivateOnlyRoute, PublicOnlyRoute } from './providers/AuthProvider';
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
import UserProfilePage from './pages/UserProfilePage';

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
          <Route path='/' element={<Navigate to="/events" replace />}/>
        </Routes>
      </Layout>
    </div>
  );
};

export default App;