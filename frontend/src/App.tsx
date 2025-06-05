import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicOnlyRoute } from './providers/AuthProvider';
import { useEffect } from "react";
import { cleanAllExpiredCaches } from "./utils/cleanupExpiredCache";
import { useAuthStore } from './store/authStore';

import Layout from './components/Layout';

import EventDetailPage from './pages/DetailedEventPage';
import EventPage from './pages/EventsPage';
import CreateEventPage from './pages/CreateEventPage';

import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegisterPage';

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
          <Route path="/events" element={<EventPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/events/create" element={<CreateEventPage />} />
          <Route path='/' element={<Navigate to="/events" replace />}/>
        </Routes>
      </Layout>
    </div>
  );
};

export default App;