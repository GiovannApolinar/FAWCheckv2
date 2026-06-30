'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PhotoValidationNotice from '@/components/PhotoValidationNotice';
import { usePhotoValidation } from '@/hooks/usePhotoValidation';
import {
  AssessmentDetail,
  fetchAuthorizedBlob,
  getAssessmentById,
} from '@/lib/api';
import { useLocale } from '@/hooks/useLocale';
// import {
//   enqueueAssessment,
//   getPendingAssessmentById,
//   getQueuedAssessmentById,
//   removePendingAssessment,
//   removeQueuedAssessment,
// } from '@/lib/offlineQueue';

type ResultViewModel = {
  recordId?: string;
  // pendingId?: string;
  // queuedId?: number;
  // evaluation?: AssessmentEvaluation;
  dap: number;
  ruleScore: number;
  finalScore: number;
  responseBand: string;
  finalConfidence: string;
  finalConfidencePercent: number;
  imageName: string;
  // imageSrc?: string | null;
  imageUrl?: string | null;
  // saveRequest?: EvaluateSaveRequest;
};

function mapDetailToViewModel(detail: AssessmentDetail): ResultViewModel {
  return {
    recordId: detail.recordId,
    dap: detail.dap,
    imageName: detail.imageName,
    imageUrl: detail.imageUrl,
    ruleScore: detail.ruleScore,
    finalScore: detail.finalScore,
    responseBand: detail.responseBand,
    finalConfidence: detail.finalConfidence,
    finalConfidencePercent: detail.finalConfidencePercent,
  };
}

// Offline pending/provisional result loading is disabled until queued sync is fixed.
// function isNetworkFailure(message: string): boolean {
//   return (
//     typeof navigator !== 'undefined' &&
//     (!navigator.onLine ||
//       /Failed to fetch/i.test(message) ||
//       /NetworkError/i.test(message) ||
//       /ECONNREFUSED/i.test(message))
//   );
// }

function ResultPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordId = searchParams?.get('recordId') ?? null;
  const { t } = useLocale();
  // const pendingId = searchParams?.get('pendingId') ?? null;
  // const provisionalId = searchParams?.get('provisionalId') ?? null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ResultViewModel | null>(null);
  const [imageObjectUrl, setImageObjectUrl] = useState('');
  // const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadResult(): Promise<void> {
      setLoading(true);
      setError('');

      try {
        if (recordId) {
          const detail = await getAssessmentById(recordId);
          if (!cancelled) {
            setResult(mapDetailToViewModel(detail));
          }
          return;
        }

        // Offline pending/provisional result routes are disabled until queued sync is fixed.
        // if (pendingId) {
        //   const pending = await getPendingAssessmentById(pendingId);
        //   if (!pending) {
        //     throw new Error('Pending assessment not found.');
        //   }
        //
        //   if (!cancelled) {
        //     setResult(buildUnsavedResult(pending.request, pending.evaluation, { pendingId: pending.id }));
        //   }
        //   return;
        // }
        //
        // if (provisionalId) {
        //   const queued = await getQueuedAssessmentById(Number(provisionalId));
        //   if (!queued || !queued.provisional) {
        //     throw new Error('Provisional assessment not found in offline queue.');
        //   }
        //
        //   if (!cancelled) {
        //     setResult(buildUnsavedResult(queued.request, queued.provisional, { queuedId: queued.id }));
        //   }
        //   return;
        // }

        throw new Error('No result reference was provided.');
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load result.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadResult();

    return () => {
      cancelled = true;
    };
  }, [recordId]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    const imageUrl = result?.imageUrl;

    setImageObjectUrl('');

    if (!imageUrl) {
      return;
    }

    const resolvedImageUrl = imageUrl;

    async function loadImage(): Promise<void> {
      try {
        const blob = await fetchAuthorizedBlob(resolvedImageUrl);
        objectUrl = URL.createObjectURL(blob);

        if (!cancelled) {
          setImageObjectUrl(objectUrl);
        }
      } catch {
        if (!cancelled) {
          setImageObjectUrl('');
        }
      }
    }

    void loadImage();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [result?.imageUrl]);

  // Adding unsaved/pending records and queueing failed saves is disabled until queued sync is fixed.

  const previewSrc = imageObjectUrl;
  const { validation: photoValidation, isValidating: isPhotoValidationRunning } = usePhotoValidation(previewSrc);

  return (
    <div className="flex min-h-[calc(100vh_-_var(--app-navbar-height))] items-center justify-center p-4">
      <div className="app-solid-panel w-full max-w-2xl rounded-[1.75rem] p-6">
        <h1 className="mb-4 text-center text-2xl font-bold text-green-800">{t('result_heading')}</h1>

        {loading && <p className="text-center text-[color:var(--muted)]">{t('result_loading')}</p>}

        {!loading && error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        {!loading && !error && result && (
          <div className="space-y-4 text-sm text-[color:var(--foreground)]">
            <p className="rounded bg-[color:var(--surface-muted)] p-3 text-[color:var(--foreground)]">
              {t('result_model_note')}
            </p>
            <PhotoValidationNotice
              validation={photoValidation}
              isValidating={isPhotoValidationRunning}
            />

            <div className="grid gap-3 md:grid-cols-2">
              <p>
                <span className="font-semibold">{t('result_final_score')}</span> {result.finalScore}
              </p>
              <p>
                <span className="font-semibold">{t('result_rule_score')}</span> {result.ruleScore}
              </p>
              <p>
                <span className="font-semibold">{t('result_response_band')}</span> {result.responseBand}
              </p>
              <p>
                <span className="font-semibold">{t('result_confidence')}</span> {result.finalConfidencePercent}%
              </p>
              <p>
                <span className="font-semibold">{t('result_dap')}</span> {result.dap}
              </p>
            </div>

            {previewSrc && (
              <div>
                <p className="mb-2 font-semibold">{t('result_captured_image')}</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewSrc}
                  alt={result.imageName}
                  className="max-h-80 w-full rounded-lg border border-[color:var(--border)] object-contain"
                />
              </div>
            )}
            <div className="grid gap-4 pt-2">
              <button
                onClick={() => router.push('/saved')}
                className="w-full rounded bg-green-600 py-2 font-semibold text-white transition hover:bg-green-700"
              >
                {t('result_btn_saved_records')}
              </button>

              <button
                onClick={() => router.push('/assessment')}
                className="w-full rounded border border-[color:var(--border)] bg-[color:var(--surface-strong)] py-2 font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--hover)]"
              >
                {t('result_btn_new_assessment')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={<div className="flex min-h-[calc(100vh_-_var(--app-navbar-height))] items-center justify-center">Loading...</div>}
    >
      <ResultPageContent />
    </Suspense>
  );
}
