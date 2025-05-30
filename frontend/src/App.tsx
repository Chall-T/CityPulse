import { Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegistrationPage } from './pages/RegisterPage';
import EventDetailPage from './pages/DetailedEventPage';
import EventPage from './pages/EventsPage';
import { PublicOnlyRoute } from './providers/AuthProvider';
import Layout from './components/Layout';
const App = () => {
  return (
    <div className="app">
      <Layout>
        <Routes>

          <Route path="/login" element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>} />
          <Route path="/register" element={
            <PublicOnlyRoute>
              <RegistrationPage />
            </PublicOnlyRoute>} />
          <Route path="/" element={<EventPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
        </Routes>
      </Layout>
    </div>
  );
};

export default App;