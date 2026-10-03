import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { toast } from 'sonner';
import { CircleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/components/layout/AuthLayout';
import { useAuth } from '@/context/session';
import { api } from '@/lib/api';

export default function Login() {
  const { login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      // Sets the httpOnly session cookie; the route guard then sends us on
      // to the page that required sign-in.
      await api('/login', { method: 'POST', body: { email: email.trim(), password } });
      login();
      toast.success('Welcome back');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-semibold">Welcome back</h1>
          <p className="text-muted-foreground">Sign in to see what your campus is up to.</p>
        </div>
        {error && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={submit}>
          <FieldGroup>
            <Field data-invalid={!!error || undefined}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error || undefined} autoFocus={!email} />
            </Field>
            <Field data-invalid={!!error || undefined}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!error || undefined} autoFocus={!!email} />
            </Field>
            <Button type="submit" size="lg" disabled={busy} className="w-full">
              {busy && <Spinner data-icon="inline-start" />}
              Sign in
            </Button>
          </FieldGroup>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          New to Nexora?{' '}
          <Link to="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">Create an account</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
