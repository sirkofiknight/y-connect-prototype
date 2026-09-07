import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import {
  AdminUsersPage, AssessmentResultPage, AssessPage, AuditPage, CasesPage, ConcernPage, ConnectPage, ConnectRequestsPage,
  ContentDetailPage, DashboardPage, DirectoryPage, EidDetailPage, EidPage, FollowupCreatePage, FollowupDetailPage, FollowupsPage,
  HomePage, LearnPage, LoginPage, ReferralDetailPage, ReferralsPage, ReportsPage, RightsPage, SafeguardingPage,
  AdminContentPage, AdminDirectoryPage,
} from '@/pages/app-pages';

const queryClient = new QueryClient();

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  return <RoutedErrorBoundary><Switch>
    <Route path="/" component={HomePage} />
    <Route path="/learn" component={LearnPage} />
    <Route path="/learn/:slug" component={ContentDetailPage} />
    <Route path="/assess" component={AssessPage} />
    <Route path="/assess/result/:id" component={AssessmentResultPage} />
    <Route path="/directory" component={DirectoryPage} />
    <Route path="/connect" component={ConnectPage} />
    <Route path="/report-concern" component={ConcernPage} />
    <Route path="/rights" component={RightsPage} />
    <Route path="/login" component={LoginPage} />
    <Route path="/dashboard" component={DashboardPage} />
    <Route path="/cases" component={CasesPage} />
    <Route path="/followup" component={FollowupsPage} />
    <Route path="/followup/new" component={FollowupCreatePage} />
    <Route path="/followup/:id" component={FollowupDetailPage} />
    <Route path="/referrals" component={ReferralsPage} />
    <Route path="/referrals/new" component={ReferralDetailPage} />
    <Route path="/referrals/:id" component={ReferralDetailPage} />
    <Route path="/eid" component={EidPage} />
    <Route path="/eid/:id" component={EidDetailPage} />
    <Route path="/connect-requests" component={ConnectRequestsPage} />
    <Route path="/safeguarding" component={SafeguardingPage} />
    <Route path="/reports" component={ReportsPage} />
    <Route path="/audit" component={AuditPage} />
    <Route path="/admin/users" component={AdminUsersPage} />
    <Route path="/admin/directory" component={AdminDirectoryPage} />
    <Route path="/admin/content" component={AdminContentPage} />
    <Route component={NotFound} />
  </Switch></RoutedErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;