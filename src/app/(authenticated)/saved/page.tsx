'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { hasValidStoredAuthToken } from '@/lib/auth';
import {
  AssessmentListItem,
  deleteAssessment,
  exportAssessmentsCsv,
  listAssessments,
} from '@/lib/api';
// import { QueueItem, countQueuedAssessments, getQueuedAssessments, syncQueuedAssessments } from '@/lib/offlineQueue';

const PAGE_SIZE = 10;

// type OfflineRecord = {
//   localId: number;
//   assessedAtUtc: string;
//   dap: number;
//   locationText?: string;
//   finalScore: number;
//   responseBand: string;
//   finalConfidencePercent: number;
//   imageName: string;
//   lastError?: string;
// };

function isNetworkFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    typeof navigator !== 'undefined' &&
    (!navigator.onLine ||
      /Failed to fetch/i.test(message) ||
      /NetworkError/i.test(message) ||
      /ECONNREFUSED/i.test(message))
  );
}

// Offline queued-record mapping is disabled until queued sync is fixed.
// function mapQueuedRecord(item: QueueItem): OfflineRecord | null {
//   if (item.id === undefined) {
//     return null;
//   }
//
//   return {
//     localId: item.id,
//     assessedAtUtc: item.request.assessedAtUtc,
//     dap: item.request.dap,
//     locationText: item.request.locationText,
//     finalScore: item.provisional.finalScore,
//     responseBand: item.provisional.responseBand,
//     finalConfidencePercent: item.provisional.finalConfidencePercent,
//     imageName: item.request.imageName,
//     lastError: item.lastError,
//   };
// }

export default function SavedRecordsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<AssessmentListItem[]>([]);
  // const [offlineRecords, setOfflineRecords] = useState<OfflineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // const [isOfflineView, setIsOfflineView] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [minScore, setMinScore] = useState('');
  const [maxScore, setMaxScore] = useState('');
  // const [pendingCount, setPendingCount] = useState(0);
  // const [syncing, setSyncing] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  // Offline sync count/listing is disabled until queued sync is fixed.
  // const refreshPendingCount = useCallback(async () => {
  //   try {
  //     const [count, queued] = await Promise.all([countQueuedAssessments(), getQueuedAssessments()]);
  //     setPendingCount(count);
  //     setOfflineRecords(queued.map(mapQueuedRecord).filter((record): record is OfflineRecord => record !== null));
  //   } catch {
  //     setPendingCount(0);
  //     setOfflineRecords([]);
  //   }
  // }, []);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await listAssessments({
        page,
        pageSize: PAGE_SIZE,
        search: search.trim() || undefined,
        minScore: minScore ? Number(minScore) : undefined,
        maxScore: maxScore ? Number(maxScore) : undefined,
      });
      setRecords(response.items);
      setTotal(response.total);
      // setIsOfflineView(false);
    } catch (loadError) {
      if (isNetworkFailure(loadError)) {
        setError('Saved records are available once you are back online.');
        // setIsOfflineView(true);
      } else {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load records.');
      }
      setRecords([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [maxScore, minScore, page, search]);

  useEffect(() => {
    let mounted = true;

    async function loadPage(): Promise<void> {
      try {
        if (!hasValidStoredAuthToken()) {
          router.replace('/auth');
          return;
        }

        await loadRecords();
      } catch {
        if (mounted) {
          router.replace('/auth');
        }
      } finally {
        if (mounted) {
          setCheckingAuth(false);
        }
      }
    }

    void loadPage();

    return () => {
      mounted = false;
    };
  }, [loadRecords, router]);

  useEffect(() => {
    const updateOnlineState = () => setIsOnline(navigator.onLine);

    updateOnlineState();
    window.addEventListener('online', updateOnlineState);
    window.addEventListener('offline', updateOnlineState);

    return () => {
      window.removeEventListener('online', updateOnlineState);
      window.removeEventListener('offline', updateOnlineState);
    };
  }, []);

  const handleDelete = async (recordId: string) => {
    if (!navigator.onLine) {
      toast.error('Delete is available once you are back online.');
      return;
    }

    if (!confirm('Delete this record?')) {
      return;
    }

    try {
      await deleteAssessment(recordId);
      toast.success('Record deleted.');
      await loadRecords();
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : 'Delete failed.';
      toast.error(message);
    }
  };

  const handleExportCsv = async () => {
    if (!navigator.onLine) {
      toast.error('CSV export is available once you are back online.');
      return;
    }

    try {
      const blob = await exportAssessmentsCsv({
        search: search.trim() || undefined,
        minScore: minScore ? Number(minScore) : undefined,
        maxScore: maxScore ? Number(maxScore) : undefined,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fawcheck-records-${new Date().toISOString()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (exportError) {
      const message = exportError instanceof Error ? exportError.message : 'CSV export failed.';
      toast.error(message);
    }
  };

  // const handleSync = async () => {
  //   if (!navigator.onLine) {
  //     toast.error('Sync is available once you are back online.');
  //     return;
  //   }
  //
  //   setSyncing(true);
  //   try {
  //     const summary = await syncQueuedAssessments();
  //     if (summary.synced > 0) {
  //       toast.success(`Synced ${summary.synced} queued record(s).`);
  //     } else if (summary.failed > 0) {
  //       toast.error(summary.errors[0] ?? 'Failed to sync queued records.');
  //     } else {
  //       toast('No queued records.');
  //     }
  //     await refreshPendingCount();
  //     await loadRecords();
  //   } finally {
  //     setSyncing(false);
  //   }
  // };

  // const hasOfflineRecords = offlineRecords.length > 0;
  const hasBackendRecords = records.length > 0;
  // const showOfflineOnlyMessage = isOfflineView && !hasOfflineRecords;

  if (checkingAuth) {
    return (
      <main className="flex min-h-[calc(100vh_-_var(--app-navbar-height))] items-center justify-center p-6 text-[color:var(--foreground)]">
        Checking authentication...
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh_-_var(--app-navbar-height))] px-4 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <nav className="app-panel flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-green-700/70">Records</p>
            <h1 className="text-2xl font-bold text-green-700">Saved Records</h1>
          </div>
          {/* Offline sync controls disabled until queued sync is fixed. */}
        </nav>

        <div className="app-panel grid gap-3 rounded-[1.75rem] p-4 md:grid-cols-4">
          <input
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Search location/image/text"
            className="app-input rounded-xl border p-2 text-sm"
          />
          <input
            type="number"
            min={1}
            max={9}
            value={minScore}
            onChange={(event) => {
              setPage(1);
              setMinScore(event.target.value);
            }}
            placeholder="Min score"
            className="app-input rounded-xl border p-2 text-sm"
          />
          <input
            type="number"
            min={1}
            max={9}
            value={maxScore}
            onChange={(event) => {
              setPage(1);
              setMaxScore(event.target.value);
            }}
            placeholder="Max score"
            className="app-input rounded-xl border p-2 text-sm"
          />
          <button
            onClick={handleExportCsv}
            disabled={!isOnline}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${
              isOnline ? 'bg-yellow-500 hover:bg-yellow-600' : 'cursor-not-allowed bg-gray-400'
            }`}
          >
            Export CSV
          </button>
        </div>

        {loading && <p className="text-[color:var(--muted)]">Loading records...</p>}
        {!loading && error && <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {/* Offline queued-record messages disabled until queued sync is fixed. */}

        {!loading && !error && (
          <div className="app-solid-panel overflow-hidden rounded-[1.75rem]">
            <div className="overflow-x-auto">
              <table className="app-table min-w-full border text-sm">
                <thead className="text-[color:var(--foreground)]">
                  <tr>
                    <th className="border px-3 py-2 text-left">Date</th>
                    <th className="border px-3 py-2 text-left">Score</th>
                    <th className="border px-3 py-2 text-left">Band</th>
                    <th className="border px-3 py-2 text-left">Confidence</th>
                    <th className="border px-3 py-2 text-left">DAP</th>
                    <th className="border px-3 py-2 text-left">Location</th>
                    <th className="border px-3 py-2 text-left">Image</th>
                    <th className="border px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!hasBackendRecords && (
                    <tr>
                      <td colSpan={8} className="border px-3 py-4 text-center text-[color:var(--muted)]">
                        No records found.
                      </td>
                    </tr>
                  )}
                  {/* Offline queued-record rows disabled until queued sync is fixed. */}
                  {records.map((record) => (
                    <tr key={record.recordId} className="transition hover:bg-[color:var(--hover)]">
                      <td className="border px-3 py-2">{new Date(record.assessedAtUtc).toLocaleString()}</td>
                      <td className="border px-3 py-2">{record.finalScore}</td>
                      <td className="border px-3 py-2">{record.responseBand}</td>
                      <td className="border px-3 py-2">{record.finalConfidencePercent}%</td>
                      <td className="border px-3 py-2">{record.dap}</td>
                      <td className="border px-3 py-2">{record.locationText || 'N/A'}</td>
                      <td className="border px-3 py-2">{record.imageName}</td>
                      <td className="border px-3 py-2">
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => router.push(`/result?recordId=${encodeURIComponent(record.recordId)}`)}
                            className="text-green-700 hover:underline"
                          >
                            View
                          </button>
                          <button
                            onClick={() =>
                              router.push(`/assessment?editRecordId=${encodeURIComponent(record.recordId)}`)
                            }
                            disabled={!isOnline}
                            className={isOnline ? 'text-amber-700 hover:underline' : 'cursor-not-allowed text-gray-400'}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(record.recordId)}
                            disabled={!isOnline}
                            className={isOnline ? 'text-red-700 hover:underline' : 'cursor-not-allowed text-gray-400'}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              page <= 1
                ? 'cursor-not-allowed border-transparent bg-gray-300 text-gray-600'
                : 'border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--foreground)] hover:bg-[color:var(--hover)]'
            }`}
          >
            Previous
          </button>
          <p className="text-sm text-[color:var(--muted)]">
            Page {page} of {totalPages}
          </p>
          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              page >= totalPages
                ? 'cursor-not-allowed border-transparent bg-gray-300 text-gray-600'
                : 'border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--foreground)] hover:bg-[color:var(--hover)]'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </main>
  );
}
