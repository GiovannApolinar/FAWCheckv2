const defaultRuntimeCaching = [
  {
    urlPattern: ({ url }: { url: URL }) =>
      url.origin === self.location.origin &&
      !url.pathname.startsWith('/api/') &&
      !url.pathname.startsWith('/_next/') &&
      !/\.[^/]+$/.test(url.pathname),
    handler: 'NetworkFirst',
    options: {
      cacheName: 'app-pages',
      networkTimeoutSeconds: 4,
      expiration: {
        maxEntries: 24,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      },
    },
  },
  {
    urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'google-fonts',
      expiration: {
        maxEntries: 4,
        maxAgeSeconds: 365 * 24 * 60 * 60,
      },
    },
  },
  {
    urlPattern: /^https:\/\/use\.fontawesome\.com\/releases\/.*/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'font-awesome',
      expiration: {
        maxEntries: 1,
        maxAgeSeconds: 365 * 24 * 60 * 60,
      },
    },
  },
  {
    urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'static-font-assets',
      expiration: {
        maxEntries: 4,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      },
    },
  },
  {
    urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'static-image-assets',
      expiration: {
        maxEntries: 64,
        maxAgeSeconds: 24 * 60 * 60,
      },
    },
  },
  {
    urlPattern: /\.(?:js)$/i,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'static-js-assets',
      expiration: {
        maxEntries: 16,
        maxAgeSeconds: 24 * 60 * 60,
      },
    },
  },
  {
    urlPattern: /\.(?:css|less)$/i,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'static-style-assets',
      expiration: {
        maxEntries: 16,
        maxAgeSeconds: 24 * 60 * 60,
      },
    },
  },
  {
    urlPattern: /.*/i,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'others',
      expiration: {
        maxEntries: 16,
        maxAgeSeconds: 24 * 60 * 60,
      },
    },
  },
];

const nextConfig = {
  output: 'standalone',
};

const offlinePwaEnabled = process.env.ENABLE_OFFLINE_SYNC === 'true';

if (offlinePwaEnabled) {
  /** @type {import('next').NextConfig} */
  const withPWA = require('next-pwa');

  module.exports = withPWA({
    ...nextConfig,
    pwa: {
      dest: 'public',
      register: true,
      skipWaiting: true,
      runtimeCaching: [
        {
          urlPattern: /\/api\//i,
          handler: 'NetworkOnly',
          options: {
            cacheName: 'api-no-store',
          },
        },
        ...defaultRuntimeCaching,
      ],
    },
  });
} else {
  // PWA service-worker registration and runtime caching are disabled while
  // offline sync is parked.
  module.exports = nextConfig;
}
