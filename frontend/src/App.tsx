import { Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegistrationPage } from './pages/RegisterPage';
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
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </Layout>
    </div>
  );
};

export default App;