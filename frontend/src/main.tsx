import 'preline';
import "./index.css";
import 'leaflet/dist/leaflet.css';
import ReactDOM from 'react-dom/client';
import App from './App';
import Preline from "./components/Preline";
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider';
const container = document.getElementById('app');
if (!container) throw new Error('Failed to find the root element');

import ReactGA from "react-ga4";

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string;

if (measurementId) {
  ReactGA.initialize(measurementId);
  ReactGA.send("pageview");
} else {
  console.warn("Google Analytics measurement ID not found in env!");
}

const root = ReactDOM.createRoot(container);

root.render(
    <BrowserRouter>
      <AuthProvider>
        <Preline />
        <App />
      </AuthProvider>
    </BrowserRouter>
);