import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

import Layout from './components/Layout';

import Home from './pages/Home';

import Register from './pages/Register';

import Login from './pages/Login';
import LoginPortal from './pages/LoginPortal';

import ForgotPassword from './pages/ForgotPassword';

import ResetPassword from './pages/ResetPassword';

import Profile from './pages/Profile';
import Notifications from './pages/Notifications';

import Help from './pages/Help';

import About from './pages/About';

import Team from './pages/Team';

import TeamMember from './pages/TeamMember';

import Dashboard from './pages/Dashboard';

import MyBallots from './pages/MyBallots';

import Vote from './pages/Vote';

import ApplyCandidate from './pages/ApplyCandidate';

import LiveResults from './pages/LiveResults';

import AdminDashboard from './pages/AdminDashboard';

import NotFound from './pages/NotFound';

import { useAuth } from './context/AuthContext';



function PrivateRoute({ children, adminOnly }) {

  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress aria-label="Checking session" />
      </Box>
    );
  }

  if (!user) return <Navigate to={adminOnly ? '/login/admin' : '/login/student'} />;

  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" />;

  return children;

}



export default function App() {

  return (

    <Layout>

      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/register" element={<Register />} />

        <Route path="/login" element={<LoginPortal />} />
        <Route path="/login/student" element={<Login portal="student" />} />
        <Route path="/login/admin" element={<Login portal="admin" />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />

        <Route path="/help" element={<Help />} />

        <Route path="/about" element={<About />} />

        <Route path="/team" element={<Team />} />

        <Route path="/team/:slug" element={<TeamMember />} />

        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

        <Route path="/my-ballots" element={<PrivateRoute><MyBallots /></PrivateRoute>} />

        <Route path="/vote/:id" element={<PrivateRoute><Vote /></PrivateRoute>} />

        <Route path="/apply" element={<PrivateRoute><ApplyCandidate /></PrivateRoute>} />

        <Route path="/live" element={<LiveResults />} />

        <Route path="/live/:id" element={<LiveResults />} />

        <Route path="/admin" element={<PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>} />

        <Route path="*" element={<NotFound />} />

      </Routes>

    </Layout>

  );

}

