import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactElement } from 'react';
import Landing from './pages/landing/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import Criativos from './pages/criativos/Criativos';
import Campanhas from './pages/campanhas/Campanhas';
import Integracoes from './pages/integracoes/Integracoes';
import { CampaignProvider } from './contexts/CampaignContext';
import { UserProvider } from './contexts/UserContext';

function PrivateRoute({ children }: { children: ReactElement }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <UserProvider>
    <CampaignProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/criativos" element={<PrivateRoute><Criativos /></PrivateRoute>} />
        <Route path="/campanhas" element={<PrivateRoute><Campanhas /></PrivateRoute>} />
        <Route path="/integracoes" element={<PrivateRoute><Integracoes /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </CampaignProvider>
    </UserProvider>
  );
}

export default App;
