const tinyPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PqQ4kQAAAABJRU5ErkJggg==';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Set SMOKE_TEST_EMAIL and SMOKE_TEST_PASSWORD to an approved bootstrap/admin account.`,
    );
  }

  return value;
}

async function requestJson(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const payload = await response.json().catch(() => null);
      const message =
        typeof payload === 'string'
          ? payload
          : payload?.message ?? payload?.title ?? JSON.stringify(payload);

      throw new Error(`${url} failed with ${response.status}: ${message}`);
    }

    const text = await response.text();
    throw new Error(`${url} failed with ${response.status}: ${text}`);
  }

  return response.status === 204 ? null : response.json();
}

async function main() {
  const appUrl = requireEnv('APP_URL').replace(/\/+$/, '');
  const apiUrl = requireEnv('API_URL').replace(/\/+$/, '');
  const email = requireEnv('SMOKE_TEST_EMAIL');
  const password = requireEnv('SMOKE_TEST_PASSWORD');

  const frontendHealth = await requestJson(`${appUrl}/api/health`, { method: 'GET' });
  if (frontendHealth.status !== 'ok') {
    throw new Error('Frontend health check did not return ok.');
  }

  const authPayload = await requestJson(`${apiUrl}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  const token = authPayload.token;
  if (!token) {
    throw new Error('Authentication token was not returned. Use an approved bootstrap/admin account for smoke tests.');
  }

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const payload = {
    clientGeneratedId: crypto.randomUUID(),
    assessedAtUtc: new Date().toISOString(),
    dap: 30,
    locationText: 'Azure smoke test',
    imageName: 'smoke-test.png',
    imageBase64: `data:image/png;base64,${tinyPngBase64}`,
    symptoms: {
      leafFeedingDamage: true,
      olderLeavesWithPinholeCount: 1,
      shotHoleLeafBand: 'few_lt5',
      elongatedLesionBand: 'few_small_upto_1_3cm',
      holeBand: 'few_small_mid',
      whorlFurlDestruction: 'none',
      plantDying: false,
      larvaeCount: 1,
    },
  };

  const saved = await requestJson(`${apiUrl}/api/assessment/evaluate-save`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(payload),
  });

  const recordId = saved.recordId;
  if (!recordId) {
    throw new Error('Assessment save response did not include a recordId.');
  }

  const list = await requestJson(`${apiUrl}/api/assessment?page=1&pageSize=10`, {
    method: 'GET',
    headers: authHeaders,
  });
  if (!Array.isArray(list.items) || !list.items.find((item) => item.recordId === recordId)) {
    throw new Error('Saved record was not found in assessment list.');
  }

  const detail = await requestJson(`${apiUrl}/api/assessment/${recordId}`, {
    method: 'GET',
    headers: authHeaders,
  });
  if (!detail.imageUrl) {
    throw new Error('Assessment detail did not include an image URL.');
  }

  const imageResponse = await fetch(detail.imageUrl, {
    method: 'GET',
    headers: authHeaders,
    cache: 'no-store',
  });
  if (!imageResponse.ok) {
    throw new Error(`Image download failed with ${imageResponse.status}.`);
  }

  const csvResponse = await fetch(`${apiUrl}/api/assessment/export/csv`, {
    method: 'GET',
    headers: authHeaders,
    cache: 'no-store',
  });
  if (!csvResponse.ok) {
    throw new Error(`CSV export failed with ${csvResponse.status}.`);
  }

  const deleteResponse = await fetch(`${apiUrl}/api/assessment/${recordId}`, {
    method: 'DELETE',
    headers: authHeaders,
    cache: 'no-store',
  });
  if (deleteResponse.status !== 204) {
    throw new Error(`Delete failed with ${deleteResponse.status}.`);
  }

  console.log(`Smoke test completed for record ${recordId}.`);
}

await main();
