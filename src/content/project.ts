import type { TranslationFn } from '@/lib/locale';
import type { Translations } from '@/lib/locale';

export interface PartnerLogo {
  src: string;
  alt: string;
  width: number;
  height: number;
  name: string;
  description: string;
}

type PartnerLogoBase = Omit<PartnerLogo, 'description'> & {
  descriptionKey: keyof Translations;
};

const PARTNER_LOGO_BASES: readonly PartnerLogoBase[] = [
  {
    src: '/icons/UPLB-VIG-ST-Color-1024x1006.webp',
    alt: 'University of the Philippines Los Banos logo',
    width: 88,
    height: 88,
    name: 'UPLB',
    descriptionKey: 'about_partner_uplb_description',
  },
  {
    src: '/icons/cropped-IPB-logo.webp',
    alt: 'Institute of Plant Breeding logo',
    width: 72,
    height: 96,
    name: 'IPB',
    descriptionKey: 'about_partner_ipb_description',
  },
  {
    src: '/icons/ics-logo.webp',
    alt: 'Institute of Computer Science logo',
    width: 78,
    height: 78,
    name: 'UPLB ICS',
    descriptionKey: 'about_partner_ics_description',
  },
];

export function getPartnerLogos(t: TranslationFn): readonly PartnerLogo[] {
  return PARTNER_LOGO_BASES.map((base) => ({
    src: base.src,
    alt: base.alt,
    width: base.width,
    height: base.height,
    name: base.name,
    description: t(base.descriptionKey),
  }));
}

export function getProjectSummary(t: TranslationFn): string {
  return t('about_summary');
}

export function getAboutSections(t: TranslationFn): ReadonlyArray<{ title: string; body: string }> {
  return [
    { title: t('about_section_overview_title'), body: t('about_section_overview_body') },
    { title: t('about_section_fieldwork_title'), body: t('about_section_fieldwork_body') },
    { title: t('about_section_collab_title'), body: t('about_section_collab_body') },
  ];
}

export function getProjectCapabilities(t: TranslationFn): readonly string[] {
  return [
    t('about_capability_scoring'),
    t('about_capability_records'),
    t('about_capability_admin'),
  ];
}
