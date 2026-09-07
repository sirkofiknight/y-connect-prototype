import { Bell, BookOpen, ClipboardCheck, Compass, FileText, HeartHandshake, LayoutDashboard, LifeBuoy, LockKeyhole, LogOut, Map, Menu, Search, ShieldCheck, Users, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { getGetCurrentUserQueryKey, useGetCurrentUser, useLogout } from '@workspace/api-client-react';

const publicLinks: Array<[string, string, LucideIcon]> = [
  ['/learn', 'Learn', BookOpen], ['/assess', 'Self-check', ClipboardCheck], ['/directory', 'Find a service', Compass],
  ['/connect', 'Talk to someone', HeartHandshake], ['/rights', 'Your rights', ShieldCheck],
];
const staffLinks: Array<[string, string, LucideIcon]> = [
  ['/dashboard', 'Overview', LayoutDashboard], ['/cases', 'Cases', Users], ['/followup', 'Follow-ups', ClipboardCheck],
  ['/referrals', 'Referrals', Compass], ['/eid', 'EID pairs', HeartHandshake], ['/connect-requests', 'Connection queue', Bell],
  ['/safeguarding', 'Safeguarding', ShieldCheck], ['/reports', 'Reports', FileText], ['/audit', 'Audit log', FileText], ['/admin/users', 'Staff access', Users], ['/admin/directory', 'Manage directory', Map], ['/admin/content', 'Manage learning', BookOpen],
];

export function Logo({ light = false }: { light?: boolean }) {
  return <Link href="/" data-testid="link-logo" className="flex items-center gap-3">
    <span className={`grid h-9 w-9 place-items-center rounded-xl ${light ? 'bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]' : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'} font-serif text-lg`}>Y</span>
    <span className={`display-font text-lg font-semibold tracking-tight ${light ? 'text-[hsl(var(--sidebar-foreground))]' : 'text-[hsl(var(--foreground))]'}`}>Y-Connect</span>
  </Link>;
}

function NavLink({ href, label, Icon, active }: { href: string; label: string; Icon: LucideIcon; active: boolean }) {
  return <Link href={href} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${active ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))]' : 'text-[hsl(var(--sidebar-foreground)/.75)] hover:bg-[hsl(var(--sidebar-accent)/.65)] hover:text-[hsl(var(--sidebar-foreground))]'}`}>
    <Icon className="h-4 w-4" /><span>{label}</span>
  </Link>;
}

function StaffSidebar({ path }: { path: string }) {
  const logout = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);
  return <><aside className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-[hsl(var(--sidebar))] px-4 py-5 text-[hsl(var(--sidebar-foreground))] transition-transform lg:static lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
    <div className="mb-8 flex items-center justify-between px-2"><Logo light /><button aria-label="Close menu" data-testid="button-close-menu" className="lg:hidden" onClick={() => setMobileOpen(false)}><X className="h-5 w-5" /></button></div>
    <p className="mono mb-3 px-3 text-[10px] uppercase tracking-[.18em] text-[hsl(var(--sidebar-foreground)/.45)]">Workspace</p>
    <nav className="space-y-1">{staffLinks.map(([href, label, Icon]) => <NavLink key={href} href={href} label={label} Icon={Icon} active={path === href || (href !== '/dashboard' && path.startsWith(href))} />)}</nav>
    <div className="absolute bottom-5 left-4 right-4 border-t border-[hsl(var(--sidebar-border))] pt-4">
      <button data-testid="button-staff-logout" onClick={() => logout.mutate()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[hsl(var(--sidebar-foreground)/.7)] hover:bg-[hsl(var(--sidebar-accent))]"><LogOut className="h-4 w-4" />Sign out</button>
      <p className="px-3 pt-3 text-[11px] text-[hsl(var(--sidebar-foreground)/.4)]">Synthetic workspace · v0.1</p>
    </div>
  </aside>{!mobileOpen && <button className="fixed left-4 top-4 z-50 rounded-xl bg-[hsl(var(--sidebar))] p-2 text-[hsl(var(--sidebar-foreground))] shadow-[var(--shadow)] lg:hidden" data-testid="button-open-menu" onClick={() => setMobileOpen(true)}><Menu className="h-5 w-5" /></button>}</>;
}

export function PublicNav() {
  const [path] = useLocation();
  return <header className="border-b border-[hsl(var(--border)/.7)] bg-[hsl(var(--background)/.88)] backdrop-blur">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8"><Logo />
      <nav className="hidden items-center gap-1 md:flex">{publicLinks.slice(0, 3).map(([href, label, Icon]) => <Link key={href} href={href} data-testid={`link-public-${label.toLowerCase().replaceAll(' ', '-')}`} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${path.startsWith(href) ? 'bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}><Icon className="h-4 w-4" />{label}</Link>)}</nav>
      <div className="flex items-center gap-2"><Link href="/login" data-testid="link-staff-login" className="rounded-xl border border-[hsl(var(--border))] px-3.5 py-2 text-sm font-medium text-[hsl(var(--primary))] hover:bg-[hsl(var(--secondary))]">Staff sign-in</Link></div>
    </div>
  </header>;
}

export function AppShell({ children, staff = false }: { children: ReactNode; staff?: boolean }) {
  const [path] = useLocation();
  const currentUser = useGetCurrentUser({ query: { enabled: staff, queryKey: getGetCurrentUserQueryKey(), retry: false } });
  if (staff && currentUser.isError) {
    return <div className="min-h-[100dvh]"><PublicNav /><main className="mx-auto flex min-h-[calc(100dvh-74px)] max-w-xl items-center justify-center px-5 py-12"><div className="w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 text-center shadow-[var(--shadow)]"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><LockKeyhole className="h-5 w-5" /></div><h1 className="display-font mt-5 text-3xl text-[hsl(var(--primary))]">Staff sign-in required</h1><p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">This workspace is limited to authorised coordination staff. Sign in to continue.</p><Link href="/login" data-testid="link-auth-required" className="mt-6 inline-flex rounded-xl bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-semibold text-[hsl(var(--primary-foreground))]">Go to staff sign-in</Link></div></main></div>;
  }
  if (staff && currentUser.isLoading) {
    return <div className="flex min-h-[100dvh] items-center justify-center bg-[hsl(var(--background))]"><p className="mono text-xs uppercase tracking-[.2em] text-[hsl(var(--muted-foreground))]">Opening staff workspace…</p></div>;
  }
  return staff ? <div className="flex min-h-[100dvh] bg-[hsl(var(--background))]"><StaffSidebar path={path} /><main className="min-w-0 flex-1">{children}</main></div> : <div className="min-h-[100dvh]"><PublicNav />{children}</div>;
}