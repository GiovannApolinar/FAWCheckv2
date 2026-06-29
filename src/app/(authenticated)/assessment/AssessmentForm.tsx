'use client';

import { useEffect, useId, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import PhotoValidationNotice from '@/components/PhotoValidationNotice';
import { usePhotoValidation } from '@/hooks/usePhotoValidation';
import {
  EvaluateSaveRequest,
  SymptomInput,
  evaluateAndSaveAssessment,
  fetchAuthorizedBlob,
  getAssessmentById,
  updateAssessment,
} from '@/lib/api';
// import { savePendingAssessment } from '@/lib/offlineQueue';
// import { buildProvisionalResponse } from '@/lib/ruleEngine';
import {
  getElongatedLesionOptions,
  getHoleOptions,
  getPinholeCountOptions,
  getShotHoleOptions,
  getWhorlDamageOptions,
} from '@/lib/symptomContent';
import { useLocale } from '@/hooks/useLocale';

const DEFAULT_SYMPTOMS: SymptomInput = {
  leafFeedingDamage: false,
  olderLeavesWithPinholeCount: 0,
  shotHoleLeafBand: 'none',
  elongatedLesionBand: 'none',
  holeBand: 'none',
  whorlFurlDestruction: 'none',
  plantDying: false,
  larvaeCount: 0,
};

type EditContext = {
  recordId: string;
  clientGeneratedId: string;
  assessedAtUtc: string;
};

// Offline fallback detection is disabled until queued sync is fixed.
// function isNetworkFailure(message: string): boolean {
//   return (
//     !navigator.onLine ||
//     /Failed to fetch/i.test(message) ||
//     /NetworkError/i.test(message) ||
//     /ECONNREFUSED/i.test(message)
//   );
// }

function supportsMobileCameraCapture(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const { maxTouchPoints, userAgent } = window.navigator;
  const isMobileDevice =
    /android|iphone|ipad|ipod|mobile/i.test(userAgent) || (/macintosh/i.test(userAgent) && maxTouchPoints > 1);

  return isMobileDevice;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Failed to read the saved image.'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read the saved image.'));
    reader.readAsDataURL(blob);
  });
}

export default function AssessmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputId = useId();
  const editRecordId = searchParams?.get('editRecordId')?.trim() ?? '';
  const isEditing = editRecordId.length > 0;

  const [dap, setDap] = useState('');
  const [locationText, setLocationText] = useState('');
  const [imageName, setImageName] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [symptoms, setSymptoms] = useState<SymptomInput>(DEFAULT_SYMPTOMS);
  const [submitting, setSubmitting] = useState(false);
  const [useCameraCapture, setUseCameraCapture] = useState(false);
  const [editContext, setEditContext] = useState<EditContext | null>(null);
  const [loadingEditRecord, setLoadingEditRecord] = useState(false);
  const [editLoadError, setEditLoadError] = useState('');
  const { t } = useLocale();
  const { validation: photoValidation, isValidating: isPhotoValidationRunning } = usePhotoValidation(imageBase64);
  const hasNotMaizeWarning = photoValidation?.warnings.some((warning) => warning.kind === 'not_maize') ?? false;

  const pinholeCountOptions = getPinholeCountOptions(t);
  const shotHoleOptions = getShotHoleOptions(t);
  const elongatedLesionOptions = getElongatedLesionOptions(t);
  const holeOptions = getHoleOptions(t);
  const whorlDamageOptions = getWhorlDamageOptions(t);

  useEffect(() => {
    setUseCameraCapture(supportsMobileCameraCapture());
  }, []);

  useEffect(() => {
    if (hasNotMaizeWarning) {
      toast.error(t('toast_not_maize'));
    }
  }, [hasNotMaizeWarning, imageBase64, t]);

  useEffect(() => {
    if (isEditing) {
      return;
    }

    setEditContext(null);
    setEditLoadError('');
    setLoadingEditRecord(false);
    setDap('');
    setLocationText('');
    setImageName('');
    setImageBase64('');
    setSymptoms(DEFAULT_SYMPTOMS);
  }, [isEditing]);

  useEffect(() => {
    let cancelled = false;

    async function loadSavedRecordForEditing(): Promise<void> {
      if (!editRecordId) {
        return;
      }

      setLoadingEditRecord(true);
      setEditLoadError('');

      try {
        const detail = await getAssessmentById(editRecordId);
        let existingImageBase64 = '';

        if (detail.imageUrl) {
          const blob = await fetchAuthorizedBlob(detail.imageUrl);
          existingImageBase64 = await blobToDataUrl(blob);
        }

        if (cancelled) {
          return;
        }

        setEditContext({
          recordId: detail.recordId,
          clientGeneratedId: detail.clientGeneratedId,
          assessedAtUtc: detail.assessedAtUtc,
        });
        setDap(String(detail.dap));
        setLocationText(detail.locationText ?? '');
        setImageName(detail.imageName);
        setImageBase64(existingImageBase64);
        setSymptoms(detail.symptoms);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setEditContext(null);
        setImageBase64('');
        setEditLoadError(error instanceof Error ? error.message : 'Failed to load the saved record.');
      } finally {
        if (!cancelled) {
          setLoadingEditRecord(false);
        }
      }
    }

    void loadSavedRecordForEditing();

    return () => {
      cancelled = true;
    };
  }, [editRecordId]);

  const updateSymptom = <K extends keyof SymptomInput>(key: K, value: SymptomInput[K]) => {
    setSymptoms((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setImageName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setImageBase64(result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isEditing && !editContext) {
      toast.error(t('toast_record_loading'));
      return;
    }

    const numericDap = Number(dap);
    if (!Number.isFinite(numericDap) || numericDap < 0) {
      toast.error(t('toast_invalid_dap'));
      return;
    }

    if (!imageBase64 || !imageName) {
      toast.error(useCameraCapture ? t('toast_photo_required_camera') : t('toast_photo_required_upload'));
      return;
    }

    if (isPhotoValidationRunning) {
      toast.error(t('toast_photo_validating'));
      return;
    }

    const request: EvaluateSaveRequest = {
      clientGeneratedId: editContext?.clientGeneratedId ?? crypto.randomUUID(),
      assessedAtUtc: editContext?.assessedAtUtc ?? new Date().toISOString(),
      dap: numericDap,
      locationText: locationText.trim() || undefined,
      imageName,
      imageBase64,
      symptoms,
    };

    if (isEditing && editContext) {
      setSubmitting(true);

      try {
        const updated = await updateAssessment(editContext.recordId, request);
        toast.success(t('toast_record_updated'));
        router.push(`/result?recordId=${encodeURIComponent(updated.recordId)}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update the saved record.';
        toast.error(message);
      } finally {
        setSubmitting(false);
      }

      return;
    }

    setSubmitting(true);

    try {
      const saved = await evaluateAndSaveAssessment(request);
      toast.success(t('toast_assessment_saved'));
      router.push(`/result?recordId=${encodeURIComponent(saved.recordId)}`);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : t('toast_assessment_failed');
      toast.error(message);

      // Offline local-result preparation is disabled until queued sync is fixed.
      // if (isNetworkFailure(message)) {
      //   try {
      //     const provisional = buildProvisionalResponse(request);
      //     await savePendingAssessment(request, provisional);
      //     toast.success('Offline mode: result prepared locally.');
      //     router.push(`/result?pendingId=${encodeURIComponent(request.clientGeneratedId)}`);
      //     return;
      //   } catch (queueError) {
      //     const queueMessage = queueError instanceof Error ? queueError.message : 'Failed to prepare offline assessment.';
      //     toast.error(queueMessage);
      //   }
      // }
    } finally {
      setSubmitting(false);
    }
  };

  const imageFieldLabel = useCameraCapture ? t('assessment_photo_label_camera') : t('assessment_photo_label_upload');
  const imageButtonLabel = useCameraCapture ? t('assessment_photo_btn_camera') : t('assessment_photo_btn_upload');
  const imageStatusLabel = imageName || (useCameraCapture ? t('assessment_photo_none_camera') : t('assessment_photo_none_upload'));
  const imageReplacementHint = useCameraCapture
    ? t('assessment_photo_replace_camera')
    : t('assessment_photo_replace_upload');

  return (
    <main
      className="relative min-h-[calc(100vh_-_var(--app-navbar-height))] bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/corn.jpg')" }}
    >
      <div className="relative z-10 flex min-h-[calc(100vh_-_var(--app-navbar-height))] items-center justify-center p-6">
        <div className="app-solid-panel w-full max-w-2xl rounded-[1.75rem] p-6 md:p-8">
          <h1 className="mb-4 text-center text-2xl font-bold text-green-700">
            {isEditing ? t('assessment_heading_edit') : t('assessment_heading_create')}
          </h1>

          {loadingEditRecord && (
            <p className="rounded-md bg-[color:var(--surface-muted)] p-3 text-center text-sm text-[color:var(--foreground)]">
              {t('assessment_loading_record')}
            </p>
          )}

          {!loadingEditRecord && editLoadError && (
            <div className="space-y-4">
              <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{editLoadError}</p>
              <button
                type="button"
                onClick={() => router.push('/saved')}
                className="w-full rounded border border-[color:var(--border)] bg-[color:var(--surface-strong)] py-2 font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--hover)]"
              >
                {t('assessment_back_to_saved')}
              </button>
            </div>
          )}

          {!loadingEditRecord && !editLoadError && (
            <form onSubmit={handleSubmit} className="space-y-5 text-[color:var(--foreground)]">
              {isEditing && (
                <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                  {t('assessment_edit_warning')}
                </p>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('assessment_dap_label')}</label>
                  <input
                    type="number"
                    min={0}
                    value={dap}
                    onChange={(event) => setDap(event.target.value)}
                    required
                    className="app-input w-full rounded-md border p-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">{t('assessment_location_label')}</label>
                  <input
                    type="text"
                    value={locationText}
                    onChange={(event) => setLocationText(event.target.value)}
                    className="app-input w-full rounded-md border p-2"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">{imageFieldLabel}</label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    id={fileInputId}
                    type="file"
                    accept="image/*"
                    capture={useCameraCapture ? 'environment' : undefined}
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                  <label
                    htmlFor={fileInputId}
                    className="inline-flex cursor-pointer items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                  >
                    {imageButtonLabel}
                  </label>
                  <span className="text-sm text-[color:var(--muted)]">{imageStatusLabel}</span>
                </div>
                {isEditing && imageBase64 && (
                  <p className="mt-2 text-xs text-[color:var(--muted)]">
                    {imageReplacementHint}
                  </p>
                )}
                <PhotoValidationNotice
                  validation={photoValidation}
                  isValidating={isPhotoValidationRunning}
                />
                <p className="mt-2 rounded-md bg-[color:var(--surface-muted)] p-3 text-sm text-[color:var(--foreground)]">
                  {t('assessment_photo_model_note')}
                </p>
              </div>

              <div className="space-y-4 border-t border-[color:var(--border)] pt-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-green-700">{t('assessment_observed_heading')}</h2>
                  <p className="text-sm text-[color:var(--muted)]">
                    {t('assessment_observed_desc')}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="mb-1 block text-sm font-medium">
                      {t('assessment_q_leaf_feeding_label')}
                    </label>
                    <p className="text-xs text-[color:var(--muted)]">
                      {t('assessment_q_leaf_feeding_hint')}
                    </p>
                    <select
                      value={symptoms.leafFeedingDamage ? 'yes' : 'no'}
                      onChange={(event) => updateSymptom('leafFeedingDamage', event.target.value === 'yes')}
                      className="app-input w-full rounded-md border p-2"
                    >
                      <option value="no">{t('assessment_option_no')}</option>
                      <option value="yes">{t('assessment_option_yes')}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="mb-1 block text-sm font-medium">
                      {t('assessment_q_pinholes_label')}
                    </label>
                    <p className="text-xs text-[color:var(--muted)]">
                      {t('assessment_q_pinholes_hint')}
                    </p>
                    <select
                      value={String(symptoms.olderLeavesWithPinholeCount)}
                      onChange={(event) =>
                        updateSymptom('olderLeavesWithPinholeCount', Number(event.target.value) as 0 | 1 | 2)
                      }
                      className="app-input w-full rounded-md border p-2"
                    >
                      {pinholeCountOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="mb-1 block text-sm font-medium">
                    {t('assessment_q_shot_hole_label')}
                  </label>
                  <p className="text-xs text-[color:var(--muted)]">
                    {t('assessment_q_shot_hole_hint')}
                  </p>
                  <select
                    value={symptoms.shotHoleLeafBand}
                    onChange={(event) =>
                      updateSymptom('shotHoleLeafBand', event.target.value as SymptomInput['shotHoleLeafBand'])
                    }
                    className="app-input w-full rounded-md border p-2"
                  >
                    {shotHoleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="mb-1 block text-sm font-medium">
                      {t('assessment_q_elongated_label')}
                    </label>
                    <p className="text-xs text-[color:var(--muted)]">
                      {t('assessment_q_elongated_hint')}
                    </p>
                    <select
                      value={symptoms.elongatedLesionBand}
                      onChange={(event) =>
                        updateSymptom('elongatedLesionBand', event.target.value as SymptomInput['elongatedLesionBand'])
                      }
                      className="app-input w-full rounded-md border p-2"
                    >
                      {elongatedLesionOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="mb-1 block text-sm font-medium">
                      {t('assessment_q_holes_label')}
                    </label>
                    <p className="text-xs text-[color:var(--muted)]">
                      {t('assessment_q_holes_hint')}
                    </p>
                    <select
                      value={symptoms.holeBand}
                      onChange={(event) => updateSymptom('holeBand', event.target.value as SymptomInput['holeBand'])}
                      className="app-input w-full rounded-md border p-2"
                    >
                      {holeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="mb-1 block text-sm font-medium">{t('assessment_q_whorl_label')}</label>
                    <p className="text-xs text-[color:var(--muted)]">
                      {t('assessment_q_whorl_hint')}
                    </p>
                    <select
                      value={symptoms.whorlFurlDestruction}
                      onChange={(event) =>
                        updateSymptom('whorlFurlDestruction', event.target.value as SymptomInput['whorlFurlDestruction'])
                      }
                      className="app-input w-full rounded-md border p-2"
                    >
                      {whorlDamageOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="mb-1 block text-sm font-medium">{t('assessment_q_larvae_label')}</label>
                    <p className="text-xs text-[color:var(--muted)]">
                      {t('assessment_q_larvae_hint')}
                    </p>
                    <input
                      type="number"
                      min={0}
                      value={symptoms.larvaeCount ?? 0}
                      onChange={(event) => updateSymptom('larvaeCount', Number(event.target.value))}
                      className="app-input w-full rounded-md border p-2"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={symptoms.plantDying}
                    onChange={(event) => updateSymptom('plantDying', event.target.checked)}
                  />
                  {t('assessment_plant_dying')}
                </label>
              </div>

              <div className={`grid gap-3 ${isEditing ? 'sm:grid-cols-2' : ''}`}>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => router.push('/saved')}
                    className="w-full rounded border border-[color:var(--border)] bg-[color:var(--surface-strong)] py-2 font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--hover)]"
                  >
                    {t('assessment_btn_cancel')}
                  </button>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full rounded py-2 font-semibold text-white transition ${
                    submitting ? 'cursor-not-allowed bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isEditing
                    ? submitting
                      ? t('assessment_btn_saving_changes')
                      : t('assessment_btn_save_changes')
                    : submitting
                      ? t('assessment_btn_saving_assessment')
                      : t('assessment_btn_save_assessment')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
