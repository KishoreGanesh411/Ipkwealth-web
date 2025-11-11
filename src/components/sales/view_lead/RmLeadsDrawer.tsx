import { useEffect, useMemo, useRef, useState } from 'react';
import { useLazyQuery } from '@apollo/client';
import { X } from 'lucide-react';
import { MY_ASSIGNED_LEADS } from '@/core/graphql/lead/lead.gql';
import { useDebounced } from '@/components/lead/LeadData/leadHelpers';

type LeadItem = {
  id?: string | null;
  leadCode?: string | null;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
};

type QueryData = {
  myAssignedLeads?: { items: LeadItem[]; page: number; pageSize: number; total: number } | null;
};

type QueryVars = {
  args: { page: number; pageSize: number; archived: boolean; status: string | null; search: string | null };
};

export default function RmLeadsDrawer({
  isOpen,
  onClose,
  onPick,
  pageSize = 40,
}: {
  isOpen: boolean;
  onClose: () => void;
  onPick?: (lead: { id: string; leadCode: string; name: string }) => void;
  pageSize?: number;
}) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(q, 250);
  const inited = useRef(false);

  const [run, { data, loading, previousData, networkStatus }] = useLazyQuery<QueryData, QueryVars>(
    MY_ASSIGNED_LEADS,
    { fetchPolicy: 'network-only', notifyOnNetworkStatusChange: true },
  );

  useEffect(() => {
    if (!isOpen) return;
    inited.current = true;
    run({ variables: { args: { page, pageSize, archived: false, status: null, search: debounced || null } } });
  }, [isOpen]);

  useEffect(() => {
    if (!inited.current || !isOpen) return;
    const t = setTimeout(() => {
      run({ variables: { args: { page, pageSize, archived: false, status: null, search: debounced || null } } });
    }, 40);
    return () => clearTimeout(t);
  }, [page, debounced, pageSize, isOpen, run]);

  const list = (data?.myAssignedLeads ?? previousData?.myAssignedLeads)?.items ?? [];
  const total = (data?.myAssignedLeads ?? previousData?.myAssignedLeads)?.total ?? 0;
  const showMore = page * pageSize < total;

  const filtered = useMemo(() => {
    const s = debounced.trim().toLowerCase();
    if (!s) return list;
    return list.filter((r) => {
      const fields = [r.email, r.phone, r.leadCode, r.name, r.firstName, r.lastName]
        .filter(Boolean)
        .map((x) => String(x).toLowerCase());
      return fields.some((f) => f.includes(s));
    });
  }, [list, debounced]);

  const close = () => onClose();
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const busy = loading || networkStatus === 4;

  return (
    <div className={`fixed inset-0 z-[950] ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!isOpen}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/35 backdrop-blur-[2px] transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={close}
      />

      {/* Slide panel */}
      <div
        role="dialog"
        aria-modal="true"
        onClick={stop}
        className="fixed right-4 top-[60px] sm:top-[72px] bottom-4 z-[960] flex w-[92vw] max-w-[520px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 transition-transform duration-300 dark:bg-gray-900"
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(120%)' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-gray-900">
          <h3 className="text-sm font-semibold">My Leads</h3>
          <button className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10" onClick={close}>
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Search */}
        <div className="border-b border-gray-100 p-3 dark:border-white/10">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search email / phone / code / name"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring dark:border-white/10 dark:bg-transparent dark:text-white/80"
            autoFocus
          />
        </div>
        {/* Body */}
        <div className="relative flex-1 overflow-y-auto p-2">
          {busy && (
            <div className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-xs shadow ring-1 ring-black/5 dark:bg-white/10">
              Loading...
            </div>
          )}
          {filtered.length === 0 && !busy ? (
            <div className="p-4 text-center text-sm text-gray-500">No leads found</div>
          ) : (
            <ul className="space-y-1">
              {filtered.map((l) => {
                const id = String(l.id ?? '');
                const name = (l.name || `${l.firstName ?? ''} ${l.lastName ?? ''}`.trim() || 'Unnamed').toString();
                const code = l.leadCode ? String(l.leadCode) : '';
                return (
                  <li key={id}>
                    <button
                      onClick={() => onPick?.({ id, leadCode: code, name })}
                      className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-sm shadow-sm hover:bg-gray-50 dark:border-white/10 dark:bg-transparent dark:hover:bg-white/5"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium text-gray-800 dark:text-white/90">{name}</div>
                        <div className="mt-0.5 text-xs text-gray-500 dark:text-white/60">{l.email || l.phone || '—'}</div>
                      </div>
                      {code && <span className="ml-3 shrink-0 rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 ring-1 ring-gray-200 dark:bg-white/10 dark:text-white/70 dark:ring-white/10">{code}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 p-2 text-xs dark:border-white/10">
          <span className="px-2 text-gray-500 dark:text-white/60">{total.toLocaleString()} total</span>
          <div className="space-x-2">
            <button
              className="rounded border border-gray-200 px-3 py-1 text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5"
              disabled={!showMore || busy}
              onClick={() => setPage((p) => p + 1)}
            >
              Load more
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
