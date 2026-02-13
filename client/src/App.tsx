import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Surveys from './pages/Surveys';
import SurveyDetail from './pages/SurveyDetail';
import Vendors from './pages/Vendors';
import Sessions from './pages/Sessions';
import CompletedSessions from './pages/CompletedSessions';
import TerminatedSessions from './pages/TerminatedSessions';
import QuotaFullSessions from './pages/QuotaFullSessions';
import StatusPreview from './pages/StatusPreview';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="surveys" element={<Surveys />} />
              <Route path="surveys/:id" element={<SurveyDetail />} />
              <Route path="surveys/:id/status/:status" element={<StatusPreview />} />
              <Route path="surveys/:surveyId/vendors" element={<Vendors />} />
              <Route path="sessions" element={<Sessions />} />
              <Route path="sessions/completed" element={<CompletedSessions />} />
              <Route path="sessions/terminated" element={<TerminatedSessions />} />
              <Route path="sessions/quota-full" element={<QuotaFullSessions />} />
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;