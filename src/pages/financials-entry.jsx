import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Financials from './Financials.jsx';
import '../styles.css';

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/financials" element={<Financials />} />
      <Route path="/financials.html" element={<Financials />} />
      <Route path="/" element={<Navigate to="/financials" replace />} />
      <Route path="*" element={<Navigate to="/financials" replace />} />
    </Routes>
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
