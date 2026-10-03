import { Navigate, Route, Routes, useLocation } from 'react-router';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/context/session';
import Feed from '@/pages/Feed';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Network from '@/pages/Network';
import NotFound from '@/pages/NotFound';
import People from '@/pages/People';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import Signup from '@/pages/Signup';

function RequireAuth({ children }) {
  const { token, signedOut } = useAuth();
  const location = useLocation();
  if (signedOut && !token) return <Navigate to="/" replace />;
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}

// Also performs the post-login redirect, back to the page that asked for auth.
function PublicOnly({ children }) {
  const { token } = useAuth();
  const location = useLocation();
  return token ? <Navigate to={location.state?.from || '/feed'} replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicOnly><Landing /></PublicOnly>} />
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />
      <Route element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route path="/feed" element={<Feed />} />
        <Route path="/people" element={<People />} />
        <Route path="/network" element={<Network />} />
        <Route path="/u/:username" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
