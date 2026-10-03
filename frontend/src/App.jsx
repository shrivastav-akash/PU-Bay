import { Navigate, Route, Routes, useLocation } from 'react-router';
import { LogoMark } from '@/components/brand/Logo';
import AppShell from '@/components/layout/AppShell';
import LoadError from '@/components/LoadError';
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

// Shown while the API confirms the session cookie (one request on page load).
function SessionCheck() {
  return (
    <div className="flex min-h-dvh items-center justify-center" role="status">
      <LogoMark className="size-10 animate-pulse text-foreground" />
      <span className="sr-only">Checking your session</span>
    </div>
  );
}

function RequireAuth({ children }) {
  const { status, signedOut, retry } = useAuth();
  const location = useLocation();
  if (status === 'checking') return <SessionCheck />;
  if (status === 'error') {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md items-center px-4">
        <LoadError title="Could not reach Nexora" error={{ message: 'The server did not answer. Check your connection and try again.' }} onRetry={retry} />
      </div>
    );
  }
  if (status === 'anonymous') {
    return signedOut
      ? <Navigate to="/" replace />
      : <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return children;
}

// Also performs the post-login redirect, back to the page that asked for auth.
// If the API is unreachable the public pages still render.
function PublicOnly({ children }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'checking') return <SessionCheck />;
  return status === 'authenticated' ? <Navigate to={location.state?.from || '/feed'} replace /> : children;
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
