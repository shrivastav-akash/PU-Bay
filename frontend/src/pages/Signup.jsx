import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { CircleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/components/layout/AuthLayout';
import { api } from '@/lib/api';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const bind = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const body = { ...form, name: form.name.trim(), username: form.username.trim(), email: form.email.trim() };
    try {
      await api('/register', { method: 'POST', body });
      toast.success('Account created. Sign in to continue.');
      navigate('/login', { state: { email: body.email } });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-semibold">Join Nexora</h1>
          <p className="text-muted-foreground">Takes a minute. Your profile can wait until later.</p>
        </div>
        {error && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={submit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Full name</FieldLabel>
              <Input id="name" autoComplete="name" required autoFocus {...bind('name')} />
            </Field>
            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <Input id="username" autoComplete="username" required pattern="[A-Za-z0-9_.]{3,30}" {...bind('username')} />
              <FieldDescription>3 to 30 letters, numbers, dots or underscores.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" autoComplete="email" required {...bind('email')} />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input id="password" type="password" autoComplete="new-password" required minLength={8} {...bind('password')} />
              <FieldDescription>At least 8 characters.</FieldDescription>
            </Field>
            <Button type="submit" size="lg" disabled={busy} className="w-full">
              {busy && <Spinner data-icon="inline-start" />}
              Create account
            </Button>
          </FieldGroup>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Already on Nexora?{' '}
          <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
