import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { useTheme } from 'next-themes';
import { CircleUser, Handshake, Layers, LogOut, Monitor, Moon, Plus, Settings, Sun, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import ErrorBoundary from '@/components/ErrorBoundary';
import UserAvatar from '@/components/UserAvatar';
import { Logo, LogoMark } from '@/components/brand/Logo';
import Composer from '@/components/feed/Composer';
import RightRail from '@/components/layout/RightRail';
import { useAuth, useData } from '@/context/session';
import { pendingInvitations } from '@/lib/connections';
import { cn } from '@/lib/utils';

export default function AppShell() {
  const { me, received } = useData();
  const [composing, setComposing] = useState(false);
  const user = me.data?.user;
  const invites = pendingInvitations(received).length;

  const nav = [
    { to: '/feed', label: 'Feed', icon: Layers },
    { to: '/people', label: 'People', icon: Users },
    { to: '/network', label: 'Network', icon: Handshake, count: invites },
    { to: user ? `/u/${user.username}` : '/settings', label: 'Profile', icon: CircleUser },
  ];
  const openComposer = () => setComposing(true);

  return (
    <div className="min-h-dvh bg-background">
      {/* Rail: icons only on tablets, labelled from lg up. */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[76px] flex-col border-r bg-background px-3 py-5 md:flex lg:w-64 lg:px-4">
        <Link to="/feed" aria-label="Nexora home" className="mb-8 flex items-center justify-center lg:justify-start lg:px-2.5">
          <Logo className="hidden lg:inline-flex" />
          <LogoMark className="lg:hidden" />
        </Link>
        <nav aria-label="Main" className="flex flex-col gap-1">
          {nav.map((item) => <RailLink key={item.label} {...item} />)}
        </nav>
        <Button onClick={openComposer} size="lg" aria-label="New post" className="mt-6 size-11 self-center px-0 lg:h-11 lg:w-full lg:self-auto lg:px-5">
          <Plus data-icon="inline-start" />
          <span className="hidden lg:inline">New post</span>
        </Button>
        <div className="mt-auto">
          <AccountMenu user={user} loading={me.status === 'loading'} />
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md md:hidden">
        <Link to="/feed" aria-label="Nexora home"><Logo /></Link>
        <AccountMenu user={user} loading={me.status === 'loading'} compact />
      </header>

      <div className="md:pl-[76px] lg:pl-64">
        <div className="mx-auto flex max-w-6xl gap-10 px-4 sm:px-6 lg:px-10">
          <main id="main" className="min-w-0 flex-1 pt-6 pb-28 md:pt-10 md:pb-12">
            <ErrorBoundary>
              <Outlet context={{ openComposer }} />
            </ErrorBoundary>
          </main>
          <aside className="sticky top-10 hidden h-fit w-80 shrink-0 pt-10 xl:block">
            <ErrorBoundary>
              <RightRail />
            </ErrorBoundary>
          </aside>
        </div>
      </div>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        {nav.slice(0, 2).map((item) => <TabLink key={item.label} {...item} />)}
        <div className="flex items-center justify-center">
          <Button size="icon-lg" variant="brand" aria-label="New post" onClick={openComposer}>
            <Plus />
          </Button>
        </div>
        {nav.slice(2).map((item) => <TabLink key={item.label} {...item} />)}
      </nav>

      <Composer open={composing} onOpenChange={setComposing} />
    </div>
  );
}

function RailLink({ to, label, icon: Icon, count }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink
          to={to}
          className={({ isActive }) => cn(
            'relative flex h-11 items-center justify-center gap-3 rounded-full px-3 text-[15px] font-medium lg:justify-start text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
            isActive && 'bg-accent text-foreground',
          )}
        >
          {({ isActive }) => (
            <>
              <Icon className={cn('size-5 shrink-0', isActive && 'text-brand')} />
              <span className="hidden lg:inline">{label}</span>
              {count > 0 && (
                <Badge className="absolute top-1.5 left-7 h-4 min-w-4 px-1 font-mono lg:static lg:ml-auto lg:h-5">
                  {count}
                  <span className="sr-only"> pending</span>
                </Badge>
              )}
            </>
          )}
        </NavLink>
      </TooltipTrigger>
      <TooltipContent side="right" className="lg:hidden">{label}</TooltipContent>
    </Tooltip>
  );
}

function TabLink({ to, label, icon: Icon, count }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn('relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset', isActive && 'text-foreground')}
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('size-5', isActive && 'text-brand')} />
          {label}
          {count > 0 && (
            <Badge className="absolute top-2 left-1/2 ml-1 h-4 min-w-4 px-1 font-mono">
              {count}
              <span className="sr-only"> pending</span>
            </Badge>
          )}
        </>
      )}
    </NavLink>
  );
}

function AccountMenu({ user, loading, compact }) {
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  if (loading && !user) return <Skeleton className={cn('size-9 rounded-full', !compact && 'lg:h-12 lg:w-full')} />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className={cn(
            'flex items-center gap-3 rounded-full text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
            !compact && 'w-full justify-center p-1.5 hover:bg-accent lg:justify-start lg:p-2',
          )}
        >
          <UserAvatar user={user} className="size-9" />
          {!compact && (
            <span className="hidden min-w-0 lg:block">
              <span className="block truncate text-sm font-medium">{user?.name}</span>
              <span className="block truncate font-mono text-xs text-muted-foreground">@{user?.username}</span>
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={compact ? 'end' : 'start'} side={compact ? 'bottom' : 'top'} className="w-56">
        <DropdownMenuLabel className="truncate">{user?.name}</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => navigate('/settings')}>
            <Settings />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="system"><Monitor />System</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="light"><Sun />Light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark"><Moon />Dark</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={logout}>
            <LogOut />
            Log out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
