export interface PartnerLogo {
  src: string;
  alt: string;
  width: number;
  height: number;
  name: string;
  description: string;
}

export const partnerLogos: readonly PartnerLogo[] = [
  {
    src: '/icons/UPLB-VIG-ST-Color-1024x1006.webp',
    alt: 'University of the Philippines Los Banos logo',
    width: 88,
    height: 88,
    name: 'UPLB',
    description: 'University of the Philippines Los Banos, one of the project’s academic partner institutions.',
  },
  {
    src: '/icons/cropped-IPB-logo.webp',
    alt: 'Institute of Plant Breeding logo',
    width: 72,
    height: 96,
    name: 'IPB',
    description: 'The Institute of Plant Breeding - Entomology Laboratory, the primary field-use partner for FAWCheck.',
  },
  {
    src: '/icons/ics-logo.webp',
    alt: 'Institute of Computer Science logo',
    width: 78,
    height: 78,
    name: 'UPLB ICS',
    description: 'The UPLB Institute of Computer Science, collaborating on the digital system and application workflow.',
  },
] as const;

export const projectSummary =
  'FAWCheck is a field tool for recording Fall Armyworm foliar damage assessments in maize. It supports guided symptom capture and record review for public pilot testing.';

export const aboutSections = [
  {
    title: 'Project overview',
    body:
      'The application helps users score maize leaf damage using the field guide, attach a captured image, and store the assessment as a structured record for later review.',
  },
  {
    title: 'How it supports fieldwork',
    body:
      'FAWCheck is designed for fast field assessments. Users can capture observations on site and save structured records for later review.',
  },
  {
    title: 'Collaboration',
    body:
      'This project is being developed in collaboration with UPLB, the Institute of Plant Breeding, and the UPLB Institute of Computer Science to support faster and more reliable maize damage rating.',
  },
] as const;

export const projectCapabilities = [
  'Guided foliar damage scoring based on the field rating guide',
  'Assessment record storage with search, filtering, and CSV export',
  // 'Offline queueing with later synchronization when connectivity returns',
  'Admin approval workflow for new sign-up requests',
] as const;
