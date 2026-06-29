'use client';

import Image from 'next/image';
import { useLocale } from '@/hooks/useLocale';
import {
  getAboutSections,
  getPartnerLogos,
  getProjectCapabilities,
  getProjectSummary,
} from '@/content/project';

export default function AboutPage() {
  const { t } = useLocale();

  const partnerLogos = getPartnerLogos(t);
  const aboutSections = getAboutSections(t);
  const projectCapabilities = getProjectCapabilities(t);

  return (
    <main className="px-4 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="app-panel rounded-[2rem] p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#13800f]">{t('about_label')}</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[color:var(--foreground)] md:text-5xl">
            {t('about_heading')}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[color:var(--muted)] md:text-lg">
            {getProjectSummary(t)}
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-4">
            {aboutSections.map((section) => (
              <article key={section.title} className="app-solid-panel rounded-[1.75rem] p-6">
                <h2 className="text-xl font-semibold text-[color:var(--foreground)]">{section.title}</h2>
                <p className="mt-3 leading-7 text-[color:var(--muted)]">{section.body}</p>
              </article>
            ))}
          </div>

          <aside className="app-solid-panel rounded-[1.75rem] p-6">
            <h2 className="text-xl font-semibold text-[color:var(--foreground)]">{t('about_partners_heading')}</h2>
            <p className="mt-3 leading-7 text-[color:var(--muted)]">
              {t('about_partners_desc')}
            </p>

            <div className="mt-6 space-y-4">
              {partnerLogos.map((logo) => (
                <div
                  key={logo.src}
                  className="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--surface-strong)] p-3">
                      <Image
                        src={logo.src}
                        alt={logo.alt}
                        width={logo.width}
                        height={logo.height}
                        className="h-auto max-h-full w-auto object-contain"
                      />
                    </div>

                    <div>
                      <p className="text-lg font-semibold text-[color:var(--foreground)]">{logo.name}</p>
                      <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">{logo.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="app-panel rounded-[2rem] p-8">
          <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">{t('about_capabilities_heading')}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {projectCapabilities.map((capability) => (
              <div
                key={capability}
                className="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-5"
              >
                <p className="font-medium leading-7 text-[color:var(--foreground)]">{capability}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
