"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Download, PawPrint, QrCode, RotateCcw, Search, Settings, ShieldCheck, Users } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type Tab = "overview" | "tags" | "users" | "pets" | "scans" | "site";
type Summary = { tags: number; activeTags: number; pets: number; scans: number; users: number };
type PageData = { total?: number; page?: number; pageSize?: number; [key: string]: unknown };

const TABS: Array<{ id: Tab; label: string; icon: typeof BarChart3 }> = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "tags", label: "Tags", icon: QrCode },
  { id: "users", label: "Customers", icon: Users },
  { id: "pets", label: "Pets", icon: PawPrint },
  { id: "scans", label: "Scans", icon: Search },
  { id: "site", label: "Site", icon: Settings }
];

function formatDate(value: unknown) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(String(value)));
}

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [token, setToken] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [data, setData] = useState<PageData>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(({ data: sessionData }) => {
      if (!sessionData.session) router.replace(`/auth?next=${encodeURIComponent("/admin")}`);
      else setToken(sessionData.session.access_token);
    });
  }, [router]);

  const api = useCallback(async (path: string, options: RequestInit = {}) => {
    const response = await fetch(path, {
      ...options,
      headers: { ...options.headers, authorization: `Bearer ${token}` }
    });
    if (response.status === 403) throw new Error("This account is not an administrator.");
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || "Request failed.");
    }
    return response;
  }, [token]);

  const load = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    setMessage("");
    try {
      if (tab === "overview") {
        setSummary(await (await api("/api/admin/summary")).json());
      } else if (tab === "site") {
        setData(await (await api("/api/admin/settings")).json());
      } else {
        const query = new URLSearchParams({ page: String(page), search });
        setData(await (await api(`/api/admin/${tab}?${query}`)).json());
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load the admin dashboard.");
    } finally {
      setBusy(false);
    }
  }, [api, page, search, tab, token]);

  useEffect(() => { load(); }, [load]);

  function selectTab(nextTab: Tab) {
    setTab(nextTab);
    setPage(1);
    setSearch("");
    setData({});
  }

  async function generateBatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      const response = await api("/api/admin/tags", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ count: form.get("count"), batchId: form.get("batchId") })
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = response.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] || "pet-tags.zip";
      link.click();
      URL.revokeObjectURL(url);
      setMessage("Batch created and downloaded.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create the batch.");
    } finally {
      setBusy(false);
    }
  }

  async function updateTagStatus(tagId: string, status: string) {
    setBusy(true);
    try {
      await api(`/api/admin/tags/${encodeURIComponent(tagId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status })
      });
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update the tag.");
    } finally {
      setBusy(false);
    }
  }

  async function releaseTag(tagId: string) {
    if (!window.confirm(`Release ${tagId}? This permanently removes its pet profile, photo, and scan history.`)) return;
    setBusy(true);
    setMessage("");
    try {
      await api(`/api/admin/tags/${encodeURIComponent(tagId)}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmTagId: tagId })
      });
      setMessage(`${tagId} is ready for a new owner.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to release the tag.");
    } finally {
      setBusy(false);
    }
  }

  async function saveSite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const response = await api("/api/admin/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form))
      });
      setData(await response.json());
      setMessage("Site settings saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save settings.");
    } finally {
      setBusy(false);
    }
  }

  const rows = (data[tab] || []) as Array<Record<string, unknown>>;
  const totalPages = Math.max(1, Math.ceil(Number(data.total || 0) / Number(data.pageSize || 25)));
  const settings = (data.settings || {}) as Record<string, string>;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-title"><ShieldCheck size={20} /> Control Center</div>
        <nav aria-label="Admin sections">
          {TABS.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => selectTab(item.id)}><Icon size={17} />{item.label}</button>;
          })}
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div><h1>{TABS.find((item) => item.id === tab)?.label}</h1><p>Pet tag operations</p></div>
        </header>
        {message ? <div className="notice">{message}</div> : null}

        {tab === "overview" && summary ? (
          <section className="metric-grid" aria-label="System totals">
            {[['Customers', summary.users], ['Tags', summary.tags], ['Active tags', summary.activeTags], ['Pets', summary.pets], ['Scans', summary.scans]].map(([label, value]) => (
              <div className="metric" key={String(label)}><span>{label}</span><strong>{value}</strong></div>
            ))}
          </section>
        ) : null}

        {tab === "tags" ? (
          <>
            <section className="admin-section">
              <h2>Create production batch</h2>
              <p className="muted">Each physical tag receives its own QR image. Customers scan it and register directly; no product card or activation code is required.</p>
              <form className="batch-form" onSubmit={generateBatch}>
                <label>Batch name<input name="batchId" defaultValue={new Date().toISOString().slice(0, 10)} required /></label>
                <label>Quantity<input name="count" type="number" min="1" max="100" defaultValue="10" required /></label>
                <button className="button" type="submit" disabled={busy}><Download size={17} />Generate & download</button>
              </form>
            </section>
            <DataToolbar search={search} setSearch={setSearch} setPage={setPage} busy={busy} />
            <DataTable columns={["Tag ID", "Batch", "Owner", "Status", "Created", "Action"]} rows={rows.map((row) => [
              row.tag_id, row.batch_id || "-", row.owner_email || "Unregistered",
              <select key={`${row.tag_id}-status`} value={String(row.status)} disabled={busy} onChange={(event) => updateTagStatus(String(row.tag_id), event.target.value)}><option value="unactivated">Unactivated</option><option value="active">Active</option><option value="lost">Lost</option><option value="disabled">Disabled</option></select>,
              formatDate(row.created_at),
              row.owner_email ? <button key={`${row.tag_id}-release`} className="icon-button danger" type="button" title="Release tag" aria-label={`Release ${row.tag_id}`} disabled={busy} onClick={() => releaseTag(String(row.tag_id))}><RotateCcw size={16} /></button> : "-"
            ])} />
          </>
        ) : null}

        {tab === "users" ? <><DataToolbar search={search} setSearch={setSearch} setPage={setPage} busy={busy} /><DataTable columns={["Email", "Joined", "Updated"]} rows={rows.map((row) => [row.email, formatDate(row.created_at), formatDate(row.updated_at)])} /></> : null}
        {tab === "pets" ? <><DataToolbar search={search} setSearch={setSearch} setPage={setPage} busy={busy} /><DataTable columns={["Pet", "Tag ID", "Breed", "Owner", "Updated"]} rows={rows.map((row) => [row.name, row.tag_id, row.breed || "-", row.owner_email, formatDate(row.updated_at)])} /></> : null}
        {tab === "scans" ? <><DataToolbar search={search} setSearch={setSearch} setPage={setPage} busy={busy} /><DataTable columns={["Tag ID", "Time", "Location", "Notification"]} rows={rows.map((row) => [row.tag_id, formatDate(row.scanned_at), row.map_url ? <a key={`${row.id}-map`} href={String(row.map_url)} target="_blank" rel="noreferrer">Open map</a> : String(row.location_permission || "-"), row.notification_status || "-"])} /></> : null}

        {tab === "site" && settings.brandName !== undefined ? (
          <section className="admin-section site-settings">
            <form onSubmit={saveSite}>
              <label>Brand name<input name="brandName" defaultValue={settings.brandName} required /></label>
              <label>Legal business name<input name="businessName" defaultValue={settings.businessName} required /></label>
              <label>Support email<input name="supportEmail" type="email" defaultValue={settings.supportEmail} /></label>
              <label>Home headline<input name="homeHeadline" defaultValue={settings.homeHeadline} required /></label>
              <label>Home text<textarea name="homeText" defaultValue={settings.homeText} required /></label>
              <button className="button" type="submit" disabled={busy}>Save changes</button>
            </form>
          </section>
        ) : null}

        {tab !== "overview" && tab !== "site" ? <Pagination page={page} totalPages={totalPages} setPage={setPage} /> : null}
        {busy && !rows.length && tab !== "overview" ? <p className="muted">Loading...</p> : null}
      </main>
    </div>
  );
}

function DataToolbar({ search, setSearch, setPage, busy }: { search: string; setSearch: (value: string) => void; setPage: (page: number) => void; busy: boolean }) {
  return <div className="data-toolbar"><Search size={18} /><input aria-label="Search" placeholder="Search" value={search} disabled={busy} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></div>;
}

function DataTable({ columns, rows }: { columns: string[]; rows: Array<Array<unknown>> }) {
  return <div className="table-scroll"><table className="data-table"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell as React.ReactNode}</td>)}</tr>) : <tr><td colSpan={columns.length}>No records found.</td></tr>}</tbody></table></div>;
}

function Pagination({ page, totalPages, setPage }: { page: number; totalPages: number; setPage: (page: number) => void }) {
  return <div className="pagination"><button className="button secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>{page} / {totalPages}</span><button className="button secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button></div>;
}
