import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getRegisteredUsers, type RegisteredUserSummary } from "../../../apiClient/registrationDashboardClient";

const formatDate = (value: string | null) => {
  if (!value) return "Never";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
};

export default function SuperSecretPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<RegisteredUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setUsers(await getRegisteredUsers());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load registrations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  const testedCount = useMemo(() => users.filter((user) => user.lastLoginAt).length, [users]);

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-text md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <button onClick={() => navigate("/")} className="mb-5 flex items-center gap-2 text-sm text-text/60 transition hover:text-text"><ArrowLeft size={16} /> Back to NovaFlow</button>
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-accent/30 bg-accent/10 p-3"><ShieldCheck className="text-accent" /></div>
              <div><h1 className="text-3xl font-medium">Registration activity</h1><p className="mt-1 text-text/60">A private, minimal view of NovaFlow accounts.</p></div>
            </div>
          </div>
          <button onClick={loadUsers} disabled={loading} className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 transition hover:border-accent disabled:opacity-50"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh</button>
        </header>

        {error ? (
          <section className="rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center"><h2 className="text-xl font-medium">This dashboard is private</h2><p className="mt-2 text-text/70">{error}</p></section>
        ) : (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-secondary p-5"><p className="text-sm text-text/60">Registered accounts</p><p className="mt-2 text-3xl">{loading ? "—" : users.length}</p></div>
              <div className="rounded-xl border border-border bg-secondary p-5"><p className="text-sm text-text/60">Have logged in</p><p className="mt-2 text-3xl">{loading ? "—" : testedCount}</p></div>
            </div>
            <section className="overflow-hidden rounded-xl border border-border bg-secondary">
              <div className="flex items-center gap-2 border-b border-border px-5 py-4"><Users size={18} /><h2 className="font-medium">Accounts</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left">
                  <thead className="bg-background/50 text-xs uppercase tracking-wider text-text/50"><tr><th className="px-5 py-3">Email</th><th className="px-5 py-3">Registered</th><th className="px-5 py-3">Last login</th><th className="px-5 py-3">Status</th></tr></thead>
                  <tbody className="divide-y divide-border">
                    {loading ? <tr><td colSpan={4} className="px-5 py-10 text-center text-text/50">Loading registrations…</td></tr> : users.length === 0 ? <tr><td colSpan={4} className="px-5 py-10 text-center text-text/50">No accounts yet.</td></tr> : users.map((user) => (
                      <tr key={`${user.email}-${user.registeredAt}`} className="hover:bg-background/30">
                        <td className="px-5 py-4 font-medium">{user.email}</td><td className="px-5 py-4 text-text/70">{formatDate(user.registeredAt)}</td><td className="px-5 py-4 text-text/70">{formatDate(user.lastLoginAt)}</td>
                        <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${user.lastLoginAt ? "bg-green-500/15 text-green-300" : "bg-text/10 text-text/55"}`}>{user.lastLoginAt ? "Tested" : "Not yet"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
