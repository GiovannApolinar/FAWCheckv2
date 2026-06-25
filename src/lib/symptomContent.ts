import { ElongatedLesionBand, HoleBand, ShotHoleLeafBand, WhorlFurlDestruction } from '@/lib/api';

type Option<T extends string | number> = {
  value: T;
  label: string;
};

export const PINHOLE_COUNT_OPTIONS: ReadonlyArray<Option<0 | 1 | 2>> = [
  { value: 0, label: 'None' },
  { value: 1, label: '1 older leaf has pinholes' },
  { value: 2, label: '2 older leaves have pinholes' },
];

export const SHOT_HOLE_OPTIONS: ReadonlyArray<Option<ShotHoleLeafBand>> = [
  { value: 'none', label: 'None' },
  { value: 'few_lt5', label: 'Fewer than 5 leaves are damaged' },
  { value: 'several_6_8', label: 'About 6 to 8 leaves are damaged' },
  { value: 'many_8_10', label: 'About 8 to 10 leaves are damaged' },
  { value: 'several_whorl_furl', label: 'Several rolled center leaves are damaged' },
  { value: 'most_whorl_furl', label: 'Most rolled center leaves are damaged' },
];

export const ELONGATED_LESION_OPTIONS: ReadonlyArray<Option<ElongatedLesionBand>> = [
  { value: 'none', label: 'None' },
  { value: 'few_small_upto_1_3cm', label: 'A few short scars (up to 1.3 cm)' },
  { value: 'several_large_gt2_5cm', label: 'Several long scars (more than 2.5 cm)' },
  { value: 'many_all_sizes', label: 'Many scars of different lengths' },
];

export const HOLE_OPTIONS: ReadonlyArray<Option<HoleBand>> = [
  { value: 'none', label: 'None' },
  { value: 'few_small_mid', label: 'A few small to medium holes' },
  { value: 'several_large', label: 'Several large holes' },
  { value: 'many_mid_large', label: 'Many medium to large holes' },
];

export const WHORL_DAMAGE_OPTIONS: ReadonlyArray<Option<WhorlFurlDestruction>> = [
  { value: 'none', label: 'None' },
  { value: 'partial', label: 'Partly damaged' },
  { value: 'almost_total', label: 'Almost completely destroyed' },
];

export function getOptionLabel<T extends string | number>(
  options: ReadonlyArray<Option<T>>,
  value: T,
  fallback = String(value),
): string {
  return options.find((option) => option.value === value)?.label ?? fallback;
}
