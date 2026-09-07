import { Bell, BookOpen, ClipboardCheck, Compass, Download, FileText, HeartHandshake, LayoutDashboard, LifeBuoy, LockKeyhole, LogOut, Map, Menu, ShieldAlert, ShieldCheck, Users, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { getGetCurrentUserQueryKey, getListNotificationsQueryKey, useGetCurrentUser, useListNotifications, useLogout, useMarkNotificationRead } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { can } from '@/lib/permissions';

const publicLinks: Array<[string, string, LucideIcon]> = [
  ['/learn', 'Learn', BookOpen], ['/assess', 'Self-check', ClipboardCheck], ['/directory', 'Find a service', Compass],
  ['/connect', 'Talk to someone', HeartHandshake], ['/rights', 'Your rights', ShieldCheck],
];
const staffLinks: Array<[string, string, LucideIcon, string]> = [
  ['/dashboard', 'Overview', LayoutDashboard, 'dashboard.view'], ['/cases', 'Cases', Users, 'cases.view'], ['/followup', 'Follow-ups', ClipboardCheck, 'followup.manage'],
  ['/referrals', 'Referrals', Compass, 'referrals.manage'], ['/eid', 'EID pairs', HeartHandshake, 'eid.manage'], ['/connect-requests', 'Connection queue', Bell, 'connect.manage'],
  ['/rights/escalations', 'Rights escalations', LifeBuoy, 'rights.escalate'],
  ['/safeguarding', 'Safeguarding', ShieldCheck, 'safeguarding.manage'], ['/reports', 'Reports', FileText, 'reports.view'], ['/audit', 'Audit log', FileText, 'audit.view'],
  ['/admin/users', 'Staff access', Users, 'admin.users'], ['/admin/directory', 'Manage directory', Map, 'admin.directory'], ['/admin/content', 'Manage learning', BookOpen, 'admin.content'],
];

export function Logo({ light = false }: { light?: boolean }) {
  return <Link href="/" data-testid="link-logo" className="flex items-center gap-3">
    <span className={`grid h-9 w-9 place-items-center rounded-xl ${light ? 'bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]' : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'} font-serif text-lg`}>Y</span>
    <span className={`display-font text-lg font-semibold tracking-tight ${light ? 'text-[hsl(var(--sidebar-foreground))]' : 'text-[hsl(var(--foreground))]'}`}>Y-Connect</span>
  </Link>;
}

function NavLink({ href, label, Icon, active, onClick }: { href: string; label: string; Icon: LucideIcon; active: boolean; onClick?: () => void }) {
  return <Link href={href} onClick={onClick} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${active ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))]' : 'text-[hsl(var(--sidebar-foreground)/.75)] hover:bg-[hsl(var(--sidebar-accent)/.65)] hover:text-[hsl(var(--sidebar-foreground))]'}`}>
    <Icon className="h-4 w-4" /><span>{label}</span>
  </Link>;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  useEffect(() => {
    const handler = (event: Event) => { event.preventDefault(); setDeferred(event as BeforeInstallPromptEvent); };
    window.addEventListener('beforeinstallprompt', handler);
    const onInstalled = () => setDeferred(null);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', handler); window.removeEventListener('appinstalled', onInstalled); };
  }, []);
  return {
    available: Boolean(deferred),
    install: async () => { await deferred?.prompt(); await deferred?.userChoice; setDeferred(null); },
  };
}

function InstallAppButton() {
  const { available, install } = useInstallPrompt();
  if (!available) return null;
  return <button type="button" data-testid="button-install-app" onClick={install} className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] px-3 py-2 text-xs font-semibold text-[hsl(var(--primary))] hover:bg-[hsl(var(--secondary))]">
    <Download className="h-3.5 w-3.5" />Install app
  </button>;
}

export function PrototypeBanner() {
  return <div data-testid="banner-prototype" className="border-b border-[hsl(var(--border))] bg-[hsl(var(--accent)/.3)] px-4 py-1.5 text-center text-[11px] font-medium tracking-wide text-[hsl(var(--foreground)/.75)]">
    PROTOTYPE · demonstration only. All data is synthetic.
  </div>;
}

export function ConcernFooter() {
  return <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card)/.6)] px-5 py-6 text-sm text-[hsl(var(--muted-foreground))]">
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
      <p>&copy; Y-Connect prototype · synthetic data only.</p>
      <div className="flex items-center gap-5">
        <Link href="/rights" data-testid="link-footer-rights" className="hover:text-[hsl(var(--foreground))]">Your rights</Link>
        <Link href="/report-concern" data-testid="link-footer-concern" className="flex items-center gap-1.5 font-semibold text-[hsl(var(--destructive))] hover:opacity-80"><ShieldAlert className="h-3.5 w-3.5" />Report a concern</Link>
      </div>
    </div>
  </footer>;
}

function NotificationBell() {
  const queryClient = useQueryClient();
  const { data } = useListNotifications();
  const markRead = useMarkNotificationRead();
  const [open, setOpen] = useState(false);
  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  return <div className="relative">
    <button aria-label="Notifications" data-testid="button-notification-bell" onClick={() => setOpen((value) => !value)} className="relative grid h-9 w-9 place-items-center rounded-xl text-[hsl(var(--sidebar-foreground)/.8)] hover:bg-[hsl(var(--sidebar-accent))]">
      <Bell className="h-4.5 w-4.5" />
      {unreadCount > 0 && <span data-testid="badge-unread-count" className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[hsl(var(--destructive))] px-1 text-[9px] font-bold text-white">{unreadCount}</span>}
    </button>
    {open && <>
      <button aria-label="Close notifications" className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 text-[hsl(var(--foreground))] shadow-[var(--shadow-xl)]">
        <p className="mono px-2 py-1 text-[10px] uppercase tracking-[.2em] text-[hsl(var(--muted-foreground))]">Notifications</p>
        <div className="mt-1 max-h-80 space-y-1 overflow-y-auto">
          {items.length === 0 ? <p className="px-2 py-4 text-center text-sm text-[hsl(var(--muted-foreground))]">All caught up.</p> : items.map((note) => <button key={note.id} data-testid={`notification-${note.id}`} onClick={() => note.unread && markRead.mutate({ id: note.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() }) })} className={`block w-full rounded-xl p-3 text-left ${note.unread ? 'bg-[hsl(var(--accent)/.24)]' : ''}`}>
            <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">{note.title}</p>{note.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-[hsl(var(--destructive))]" />}</div>
            <p className="mt-1 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{note.body}</p>
          </button>)}
        </div>
      </div>
    </>}
  </div>;
}

function StaffTopbar({ name, roleLabel }: { name?: string; roleLabel?: string }) {
  return <div className="hidden items-center justify-end gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-3 lg:flex">
    <InstallAppButton />
    <NotificationBell />
    <div className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] px-3 py-1.5 text-sm">
      <span className="font-semibold">{name ?? 'Signed in'}</span>
      <span className="text-[hsl(var(--muted-foreground))]">· {roleLabel ?? ''}</span>
    </div>
  </div>;
}

function StaffSidebar({ path, permissions }: { path: string; permissions: string[] }) {
  const logout = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibleLinks = staffLinks.filter(([, , , permission]) => permissions.includes(permission));
  return <><aside className={`fixed inset-y-0 left-0 z-40 flex max-h-[100dvh] w-[min(86vw,16rem)] flex-col overflow-y-auto bg-[hsl(var(--sidebar))] px-4 py-5 text-[hsl(var(--sidebar-foreground))] shadow-[var(--shadow-xl)] transition-transform lg:static lg:w-64 lg:translate-x-0 lg:shadow-none ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
    <div className="mb-8 flex items-center justify-between px-2"><Logo light /><button aria-label="Close menu" data-testid="button-close-menu" className="lg:hidden" onClick={() => setMobileOpen(false)}><X className="h-5 w-5" /></button></div>
    <p className="mono mb-3 px-3 text-[10px] uppercase tracking-[.18em] text-[hsl(var(--sidebar-foreground)/.45)]">Workspace</p>
    <nav className="flex-1 space-y-1">{visibleLinks.map(([href, label, Icon]) => <NavLink key={href} href={href} label={label} Icon={Icon} active={path === href || (href !== '/dashboard' && path.startsWith(href))} onClick={() => setMobileOpen(false)} />)}</nav>
    <div className="mt-6 border-t border-[hsl(var(--sidebar-border))] pt-4 lg:hidden"><NotificationBell /></div>
    <div className="mt-6 border-t border-[hsl(var(--sidebar-border))] pt-4">
      <button data-testid="button-staff-logout" onClick={() => logout.mutate()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[hsl(var(--sidebar-foreground)/.7)] hover:bg-[hsl(var(--sidebar-accent))]"><LogOut className="h-4 w-4" />Sign out</button>
      <p className="px-3 pt-3 text-[11px] text-[hsl(var(--sidebar-foreground)/.4)]">Synthetic workspace · v0.1</p>
    </div>
  </aside>{mobileOpen && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-[hsl(var(--primary)/.35)] lg:hidden" data-testid="button-close-menu-backdrop" onClick={() => setMobileOpen(false)} />}{!mobileOpen && <button className="fixed left-4 top-4 z-50 rounded-xl bg-[hsl(var(--sidebar))] p-2 text-[hsl(var(--sidebar-foreground))] shadow-[var(--shadow)] lg:hidden" data-testid="button-open-menu" onClick={() => setMobileOpen(true)}><Menu className="h-5 w-5" /></button>}</>;
}

export function PublicNav() {
  const [path] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  return <header className="border-b border-[hsl(var(--border)/.7)] bg-[hsl(var(--background)/.88)] backdrop-blur">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-5 lg:px-8"><Logo />
      <nav className="hidden items-center gap-1 lg:flex">{publicLinks.map(([href, label, Icon]) => <Link key={href} href={href} data-testid={`link-public-${label.toLowerCase().replaceAll(' ', '-')}`} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${path.startsWith(href) ? 'bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}><Icon className="h-4 w-4" />{label}</Link>)}</nav>
      <div className="flex items-center gap-2"><InstallAppButton /><Link href="/login" data-testid="link-staff-login" className="rounded-xl border border-[hsl(var(--border))] px-3 py-2 text-xs font-semibold text-[hsl(var(--primary))] hover:bg-[hsl(var(--secondary))] sm:px-3.5 sm:text-sm">Staff sign-in</Link><button aria-label="Open navigation" aria-expanded={mobileOpen} data-testid="button-open-public-menu" className="grid h-10 w-10 place-items-center rounded-xl border border-[hsl(var(--border))] text-[hsl(var(--primary))] lg:hidden" onClick={() => setMobileOpen(value => !value)}>{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button></div>
    </div>
    {mobileOpen && <nav className="border-t border-[hsl(var(--border)/.7)] bg-[hsl(var(--card))] px-4 py-3 shadow-[var(--shadow-sm)] lg:hidden">{publicLinks.map(([href, label, Icon]) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} data-testid={`link-public-mobile-${label.toLowerCase().replaceAll(' ', '-')}`} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${path.startsWith(href) ? 'bg-[hsl(var(--secondary))] font-semibold text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}`}><Icon className="h-4 w-4" />{label}</Link>)}</nav>}
  </header>;
}

function AccessDenied({ roleLabel }: { roleLabel?: string }) {
  return <main className="mx-auto flex min-h-[calc(100dvh-74px)] max-w-xl items-center justify-center px-5 py-12">
    <div className="w-full rounded-2xl border border-[hsl(var(--destructive)/.3)] bg-[hsl(var(--destructive)/.05)] p-8 text-center shadow-[var(--shadow)]" data-testid="state-access-denied">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[hsl(var(--destructive)/.12)] text-[hsl(var(--destructive))]"><ShieldAlert className="h-5 w-5" /></div>
      <h1 className="display-font mt-5 text-3xl text-[hsl(var(--destructive))]">Access denied</h1>
      <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{roleLabel ? `Your role (${roleLabel}) does not include access to this area.` : 'Your role does not include access to this area.'} If you believe this is wrong, ask an administrator to review your permissions.</p>
      <Link href="/dashboard" data-testid="link-access-denied-dashboard" className="mt-6 inline-flex rounded-xl bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-semibold text-[hsl(var(--primary-foreground))]">Back to overview</Link>
    </div>
  </main>;
}

export function AppShell({ children, staff = false, permission }: { children: ReactNode; staff?: boolean; permission?: string }) {
  const [path] = useLocation();
  const currentUser = useGetCurrentUser({ query: { enabled: staff, queryKey: getGetCurrentUserQueryKey(), retry: false } });
  if (staff && currentUser.isError) {
    return <div className="min-h-[100dvh]"><PublicNav /><main className="mx-auto flex min-h-[calc(100dvh-74px)] max-w-xl items-center justify-center px-5 py-12"><div className="w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 text-center shadow-[var(--shadow)]"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><LockKeyhole className="h-5 w-5" /></div><h1 className="display-font mt-5 text-3xl text-[hsl(var(--primary))]">Staff sign-in required</h1><p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">This workspace is limited to authorised coordination staff. Sign in to continue.</p><Link href="/login" data-testid="link-auth-required" className="mt-6 inline-flex rounded-xl bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-semibold text-[hsl(var(--primary-foreground))]">Go to staff sign-in</Link></div></main></div>;
  }
  if (staff && currentUser.isLoading) {
    return <div className="flex min-h-[100dvh] items-center justify-center bg-[hsl(var(--background))]"><p className="mono text-xs uppercase tracking-[.2em] text-[hsl(var(--muted-foreground))]">Opening staff workspace…</p></div>;
  }
  const user = currentUser.data;
  const permissions = user?.permissions ?? [];
  const denied = staff && permission ? !can(user, permission) : false;
  return staff
    ? <div className="flex min-h-[100dvh] bg-[hsl(var(--background))]">
        <StaffSidebar path={path} permissions={permissions} />
        <main className="min-w-0 flex-1 pt-16 lg:pt-0">
          <PrototypeBanner />
          <StaffTopbar name={user?.name} roleLabel={user?.roleLabel} />
          {denied ? <AccessDenied roleLabel={user?.roleLabel} /> : children}
          <ConcernFooter />
        </main>
      </div>
    : <div className="min-h-[100dvh]"><PrototypeBanner /><PublicNav />{children}<ConcernFooter /></div>;
}
