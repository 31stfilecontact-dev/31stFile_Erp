import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import AccountsPage from "@/pages/AccountsPage";
import TransactionsPage from "@/pages/TransactionsPage";
import JournalEntryPage from "@/pages/JournalEntryPage";
import LedgerPage from "@/pages/LedgerPage";
import TrialBalancePage from "@/pages/TrialBalancePage";
import PLStatementPage from "@/pages/PLStatementPage";
import BalanceSheetPage from "@/pages/BalanceSheetPage";
import UPICapturePage from "@/pages/UPICapturePage";
import NotesPage from "@/pages/NotesPage";
import SettingsPage from "@/pages/SettingsPage";

const queryClient = new QueryClient();

function useAuth() {
  const [auth, setAuth] = useState<"loading" | "ok" | "no">("loading");
  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => { setAuth(r.ok ? "ok" : "no"); })
      .catch(() => setAuth("no"));
  }, []);
  return auth;
}

function PrivateRoute({ component: C }: { component: React.ComponentType }) {
  const auth = useAuth();
  if (auth === "loading") return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <span className="material-symbols-outlined" style={{ fontSize: 40, color: "#00696d", animation: "spin 1s linear infinite" }}>autorenew</span>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  if (auth === "no") return <Redirect to="/login" />;
  return <Layout><C /></Layout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/">{() => <Redirect to="/dashboard" />}</Route>
      <Route path="/dashboard">{() => <PrivateRoute component={DashboardPage} />}</Route>
      <Route path="/accounts">{() => <PrivateRoute component={AccountsPage} />}</Route>
      <Route path="/transactions">{() => <PrivateRoute component={TransactionsPage} />}</Route>
      <Route path="/journal-entry">{() => <PrivateRoute component={JournalEntryPage} />}</Route>
      <Route path="/ledger/:code">{() => <PrivateRoute component={LedgerPage} />}</Route>
      <Route path="/trial-balance">{() => <PrivateRoute component={TrialBalancePage} />}</Route>
      <Route path="/pl-statement">{() => <PrivateRoute component={PLStatementPage} />}</Route>
      <Route path="/balance-sheet">{() => <PrivateRoute component={BalanceSheetPage} />}</Route>
      <Route path="/upi-capture">{() => <PrivateRoute component={UPICapturePage} />}</Route>
      <Route path="/notes">{() => <PrivateRoute component={NotesPage} />}</Route>
      <Route path="/settings">{() => <PrivateRoute component={SettingsPage} />}</Route>
      <Route>{() => <Redirect to="/dashboard" />}</Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
