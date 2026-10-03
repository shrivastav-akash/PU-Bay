import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Camera, LogOut, Monitor, Moon, Plus, Sun, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet, FieldLegend } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/ui/item';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import LoadError from '@/components/LoadError';
import UserAvatar from '@/components/UserAvatar';
import { useAuth, useData } from '@/context/session';
import { api } from '@/lib/api';

export default function Settings() {
  const { me } = useData();

  if (me.status === 'loading') {
    return (
      <div className="flex flex-col gap-6" aria-busy="true">
        <Skeleton className="h-8 w-40" />
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
      </div>
    );
  }
  if (me.status === 'error') return <LoadError title="Could not load your settings" error={me.error} onRetry={me.reload} />;

  const { user, profile } = me.data;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Everything here shows on your <Link to={`/u/${user.username}`} className="text-foreground underline-offset-4 hover:underline">public profile</Link>.
        </p>
      </div>
      <PhotoCard user={user} />
      <ProfileForm key={user._id} user={user} profile={profile} />
      <AppearanceCard />
      <SessionCard />
    </div>
  );
}

function PhotoCard({ user }) {
  const { token, me, profiles } = useData();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    const form = new FormData();
    form.append('profile_picture', file);
    try {
      await api('/update_profile_picture', { method: 'POST', form, token });
      await Promise.all([me.reload(), profiles.reload()]);
      toast.success('Photo updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Photo</CardTitle>
        <CardDescription>A clear face photo helps classmates recognise you.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-5">
        <UserAvatar user={user} className="size-20" fallbackClassName="text-xl" />
        <input ref={input} type="file" accept="image/*" onChange={upload} className="sr-only" tabIndex={-1} aria-hidden="true" />
        <Button variant="outline" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? <Spinner data-icon="inline-start" /> : <Camera data-icon="inline-start" />}
          Upload new photo
        </Button>
      </CardContent>
    </Card>
  );
}

const blankWork = { company: '', position: '', years: '' };
const blankEdu = { school: '', degree: '', fieldOfStudy: '' };

function ProfileForm({ user, profile }) {
  const { token, me, profiles } = useData();
  const [account, setAccount] = useState({ name: user.name || '', username: user.username || '', email: user.email || '' });
  const [about, setAbout] = useState({ currentPost: profile?.currentPost || '', bio: profile?.bio || '' });
  const [work, setWork] = useState(profile?.pastWork || []);
  const [education, setEducation] = useState(profile?.education || []);
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api('/user_update', { method: 'POST', body: account, token });
      await api('/update_profile_data', { method: 'POST', body: { ...about, pastWork: work, education }, token });
      await Promise.all([me.reload(), profiles.reload()]);
      toast.success('Profile saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const bind = (state, set, key) => ({ value: state[key], onChange: (e) => set({ ...state, [key]: e.target.value }) });

  return (
    <form onSubmit={save}>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your name, handle and résumé details.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <FieldSet>
              <FieldLegend>Account</FieldLegend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="name">Full name</FieldLabel>
                  <Input id="name" autoComplete="name" required {...bind(account, setAccount, 'name')} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="username">Username</FieldLabel>
                  <Input id="username" autoComplete="username" required {...bind(account, setAccount, 'username')} />
                  <FieldDescription>Your profile lives at /u/{account.username || 'username'}.</FieldDescription>
                </Field>
                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input id="email" type="email" autoComplete="email" required {...bind(account, setAccount, 'email')} />
                </Field>
              </div>
            </FieldSet>

            <FieldSet>
              <FieldLegend>About</FieldLegend>
              <Field>
                <FieldLabel htmlFor="headline">Headline</FieldLabel>
                <Input id="headline" placeholder="e.g. B.Tech CSE, 3rd year" {...bind(about, setAbout, 'currentPost')} />
              </Field>
              <Field>
                <FieldLabel htmlFor="bio">Bio</FieldLabel>
                <Textarea id="bio" rows={3} {...bind(about, setAbout, 'bio')} />
              </Field>
            </FieldSet>

            <ListEditor
              legend="Experience"
              items={work}
              setItems={setWork}
              blank={blankWork}
              required={['company', 'position']}
              fields={[['position', 'Role'], ['company', 'Company'], ['years', 'Years']]}
              title={(w) => w.position}
              detail={(w) => [w.company, w.years].filter(Boolean).join(', ')}
            />
            <ListEditor
              legend="Education"
              items={education}
              setItems={setEducation}
              blank={blankEdu}
              required={['school', 'degree']}
              fields={[['school', 'School'], ['degree', 'Degree'], ['fieldOfStudy', 'Field of study']]}
              title={(e) => e.school}
              detail={(e) => [e.degree, e.fieldOfStudy].filter(Boolean).join(', ')}
            />
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end border-t">
          <Button type="submit" disabled={saving}>
            {saving && <Spinner data-icon="inline-start" />}
            Save changes
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

function ListEditor({ legend, items, setItems, blank, required, fields, title, detail }) {
  const [draft, setDraft] = useState(blank);
  const ready = required.every((k) => draft[k].trim());
  const slug = legend.toLowerCase();

  const add = () => {
    if (!ready) return;
    setItems([...items, Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, v.trim()]))]);
    setDraft(blank);
  };

  return (
    <FieldSet>
      <FieldLegend>{legend}</FieldLegend>
      {items.length > 0 && (
        <ItemGroup>
          {items.map((item, i) => (
            <Item key={item._id || i} variant="muted" size="sm">
              <ItemContent className="min-w-0">
                <ItemTitle>{title(item)}</ItemTitle>
                <ItemDescription className="truncate">{detail(item)}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove ${title(item)}`} onClick={() => setItems(items.filter((_, j) => j !== i))}>
                  <X />
                </Button>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      )}
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
        {fields.map(([key, label]) => (
          <Field key={key}>
            <FieldLabel htmlFor={`${slug}-${key}`}>{label}</FieldLabel>
            <Input
              id={`${slug}-${key}`}
              value={draft[key]}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
            />
          </Field>
        ))}
        <Button type="button" variant="outline" disabled={!ready} onClick={add}>
          <Plus data-icon="inline-start" />
          Add
        </Button>
      </div>
      <FieldDescription>Added entries are saved with “Save changes”.</FieldDescription>
    </FieldSet>
  );
}

function AppearanceCard() {
  const { theme, setTheme } = useTheme();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>System follows your device setting.</CardDescription>
      </CardHeader>
      <CardContent>
        <ToggleGroup type="single" variant="outline" value={theme} onValueChange={(v) => v && setTheme(v)} aria-label="Theme">
          <ToggleGroupItem value="system"><Monitor />System</ToggleGroupItem>
          <ToggleGroupItem value="light"><Sun />Light</ToggleGroupItem>
          <ToggleGroupItem value="dark"><Moon />Dark</ToggleGroupItem>
        </ToggleGroup>
      </CardContent>
    </Card>
  );
}

function SessionCard() {
  const { logout } = useAuth();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Session</CardTitle>
        <CardDescription>Signs you out on this device.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={logout}>
          <LogOut data-icon="inline-start" />
          Log out
        </Button>
      </CardContent>
    </Card>
  );
}
