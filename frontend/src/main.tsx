import 'preline';
import "./index.css";
import 'leaflet/dist/leaflet.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Preline from "./components/Preline";
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider';
const container = document.getElementById('app');
if (!container) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(container);

root.render(
    <BrowserRouter>
      <AuthProvider>
        <Preline />
        <App />
      </AuthProvider>
    </BrowserRouter>
);