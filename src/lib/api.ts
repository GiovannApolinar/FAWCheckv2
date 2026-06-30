import { getActiveAuthToken } from '@/lib/auth';

function normalizeApiBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function resolveServerApiBaseUrl(): string {
  const configuredValue = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (configuredValue) {
    return normalizeApiBaseUrl(configuredValue);
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:5268';
  }

  throw new Error('NEXT_PUBLIC_API_BASE_URL is required in production.');
}

let runtimeApiBaseUrlPromise: Promise<string> | null = null;

export async function getApiBaseUrl(): Promise<string> {
  if (typeof window === 'undefined') {
    return resolveServerApiBaseUrl();
  }

  if (!runtimeApiBaseUrlPromise) {
    runtimeApiBaseUrlPromise = fetch('/api/runtime-config', {
      method: 'GET',
      cache: 'no-store',
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load runtime API configuration.');
        }

        const payload = (await response.json()) as { apiBaseUrl?: string };
        if (payload.apiBaseUrl) {
          return normalizeApiBaseUrl(payload.apiBaseUrl);
        }

        if (process.env.NODE_ENV !== 'production') {
          return 'http://localhost:5268';
        }

        throw new Error('NEXT_PUBLIC_API_BASE_URL is required in production.');
      })
      .catch((error) => {
        runtimeApiBaseUrlPromise = null;
        throw error;
      });
  }

  return runtimeApiBaseUrlPromise;
}

export type ShotHoleLeafBand =
  | 'none'
  | 'few_lt5'
  | 'several_6_8'
  | 'many_8_10'
  | 'several_whorl_furl'
  | 'most_whorl_furl';

export type ElongatedLesionBand =
  | 'none'
  | 'few_small_upto_1_3cm'
  | 'several_large_gt2_5cm'
  | 'many_all_sizes';

export type HoleBand = 'none' | 'few_small_mid' | 'several_large' | 'many_mid_large';
export type WhorlFurlDestruction = 'none' | 'partial' | 'almost_total';

export interface SymptomInput {
  leafFeedingDamage: boolean;
  olderLeavesWithPinholeCount: 0 | 1 | 2;
  shotHoleLeafBand: ShotHoleLeafBand;
  elongatedLesionBand: ElongatedLesionBand;
  holeBand: HoleBand;
  whorlFurlDestruction: WhorlFurlDestruction;
  plantDying: boolean;
  larvaeCount?: number;
}

export interface EvaluateSaveRequest {
  clientGeneratedId: string;
  assessedAtUtc: string;
  dap: number;
  locationText?: string;
  imageName: string;
  imageBase64: string;
  symptoms: SymptomInput;
}

export interface ImagePrediction {
  label: string;
  confidence: number;
}

export interface AssessmentEvaluation {
  ruleScore: number;
  finalScore: number;
  responseBand: string;
  imagePrediction?: ImagePrediction;
  finalConfidence: string;
  finalConfidencePercent: number;
  flags: string[];
  explanation: string;
}

export interface EvaluateSaveResponse extends AssessmentEvaluation {
  recordId: string;
  savedAtUtc: string;
}

export interface AssessmentListItem {
  recordId: string;
  assessedAtUtc: string;
  dap: number;
  locationText?: string;
  finalScore: number;
  responseBand: string;
  finalConfidence: string;
  finalConfidencePercent: number;
  imageName: string;
  explanation: string;
}

export interface PagedAssessmentsResponse {
  page: number;
  pageSize: number;
  total: number;
  items: AssessmentListItem[];
}

export interface AssessmentDetail {
  recordId: string;
  clientGeneratedId: string;
  assessedAtUtc: string;
  savedAtUtc: string;
  dap: number;
  locationText?: string;
  imageName: string;
  imageUrl?: string | null;
  ruleScore: number;
  finalScore: number;
  responseBand: string;
  imagePrediction?: ImagePrediction;
  finalConfidence: string;
  finalConfidencePercent: number;
  flags: string[];
  explanation: string;
  symptoms: SymptomInput;
}

export interface PendingAuthResponse {
  email: string;
  status: string;
  message: string;
}

// export interface PendingUserSummary {
//   userId: string;
//   email: string;
//   registeredAtUtc: string;
// }

// export interface ApprovedUserSummary {
//   userId: string;
//   email: string;
//   registeredAtUtc: string;
//   approvedAtUtc: string;
//   approvedByUserId?: string | null;
// }

export interface ProfileSummary {
  userId: string;
  email: string;
  name: string;
  section: string;
  role: string;
  canDeleteAccount: boolean;
}

// Offline queued sync response is parked until the browser queue flow is fixed.
// export interface SyncAssessmentsResponse {
//   totalReceived: number;
//   saved: number;
//   failed: number;
//   errors: string[];
//   results: EvaluateSaveResponse[];
// }

async function readErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string; title?: string }
      | string
      | null;

    if (typeof payload === 'string' && payload) {
      return payload;
    }

    if (payload && typeof payload !== 'string' && payload.message) {
      return payload.message;
    }

    if (payload && typeof payload !== 'string' && payload.title) {
      return payload.title;
    }

    if (payload) {
      return JSON.stringify(payload);
    }

    return `Request failed with status ${response.status}`;
  }

  return (await response.text()) || `Request failed with status ${response.status}`;
}

async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  return getActiveAuthToken();
}

async function requestJson<T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> {
  const apiBaseUrl = await getApiBaseUrl();
  const headers = new Headers(init.headers ?? {});
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;

  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (authenticated) {
    const token = await getAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }

    if (response.status === 403) {
      throw new Error((await readErrorMessage(response)) || 'Forbidden');
    }

    throw new Error(await readErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function fetchAuthorizedBlob(url: string): Promise<Blob> {
  const headers = new Headers();
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Unauthorized');
  }

  headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(url, {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }

    if (response.status === 403) {
      throw new Error((await readErrorMessage(response)) || 'Forbidden');
    }

    throw new Error(await readErrorMessage(response));
  }

  return response.blob();
}

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  });
  const value = query.toString();
  return value ? `?${value}` : '';
}

export async function evaluateAndSaveAssessment(payload: EvaluateSaveRequest): Promise<EvaluateSaveResponse> {
  return requestJson<EvaluateSaveResponse>('/api/assessment/evaluate-save', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function evaluateAssessment(payload: EvaluateSaveRequest): Promise<AssessmentEvaluation> {
  return requestJson<AssessmentEvaluation>('/api/assessment/evaluate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Offline queued sync API call is disabled until the browser queue flow is fixed.
// export async function syncAssessments(records: EvaluateSaveRequest[]): Promise<SyncAssessmentsResponse> {
//   return requestJson<SyncAssessmentsResponse>('/api/assessment/sync', {
//     method: 'POST',
//     body: JSON.stringify({ records }),
//   });
// }

export async function listAssessments(params: {
  page?: number;
  pageSize?: number;
  fromUtc?: string;
  toUtc?: string;
  minScore?: number;
  maxScore?: number;
  search?: string;
}): Promise<PagedAssessmentsResponse> {
  const query = buildQueryString({
    page: params.page,
    pageSize: params.pageSize,
    fromUtc: params.fromUtc,
    toUtc: params.toUtc,
    minScore: params.minScore,
    maxScore: params.maxScore,
    search: params.search,
  });

  return requestJson<PagedAssessmentsResponse>(`/api/assessment${query}`, {
    method: 'GET',
  });
}

export async function getAssessmentById(recordId: string): Promise<AssessmentDetail> {
  return requestJson<AssessmentDetail>(`/api/assessment/${encodeURIComponent(recordId)}`, {
    method: 'GET',
  });
}

export async function updateAssessment(recordId: string, payload: EvaluateSaveRequest): Promise<EvaluateSaveResponse> {
  return requestJson<EvaluateSaveResponse>(`/api/assessment/${encodeURIComponent(recordId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteAssessment(recordId: string): Promise<void> {
  await requestJson<void>(`/api/assessment/${encodeURIComponent(recordId)}`, {
    method: 'DELETE',
  });
}

export async function exportAssessmentsCsv(params: {
  fromUtc?: string;
  toUtc?: string;
  minScore?: number;
  maxScore?: number;
  search?: string;
}): Promise<Blob> {
  const query = buildQueryString({
    fromUtc: params.fromUtc,
    toUtc: params.toUtc,
    minScore: params.minScore,
    maxScore: params.maxScore,
    search: params.search,
  });

  const headers = new Headers();
  const token = await getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/assessment/export/csv${query}`, {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.blob();
}


export async function getProfile(): Promise<ProfileSummary> {
  return requestJson<ProfileSummary>('/api/profile', {
    method: 'GET',
  });
}

export async function updateProfile(profile: { name: string; section: string }): Promise<ProfileSummary> {
  return requestJson<ProfileSummary>('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
}

export async function deleteProfileAccount(): Promise<void> {
  await requestJson<void>('/api/profile', {
    method: 'DELETE',
  });
}
