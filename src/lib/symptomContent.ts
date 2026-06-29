import type { TranslationFn } from '@/lib/locale';
import { ElongatedLesionBand, HoleBand, ShotHoleLeafBand, WhorlFurlDestruction } from '@/lib/api';

type Option<T extends string | number> = {
  value: T;
  label: string;
};

export function getPinholeCountOptions(t: TranslationFn): ReadonlyArray<Option<0 | 1 | 2>> {
  return [
    { value: 0, label: t('symptom_none') },
    { value: 1, label: t('symptom_pinhole_1') },
    { value: 2, label: t('symptom_pinhole_2') },
  ];
}

export function getShotHoleOptions(t: TranslationFn): ReadonlyArray<Option<ShotHoleLeafBand>> {
  return [
    { value: 'none', label: t('symptom_none') },
    { value: 'few_lt5', label: t('symptom_shot_hole_few_lt5') },
    { value: 'several_6_8', label: t('symptom_shot_hole_several_6_8') },
    { value: 'many_8_10', label: t('symptom_shot_hole_many_8_10') },
    { value: 'several_whorl_furl', label: t('symptom_shot_hole_several_whorl') },
    { value: 'most_whorl_furl', label: t('symptom_shot_hole_most_whorl') },
  ];
}

export function getElongatedLesionOptions(t: TranslationFn): ReadonlyArray<Option<ElongatedLesionBand>> {
  return [
    { value: 'none', label: t('symptom_none') },
    { value: 'few_small_upto_1_3cm', label: t('symptom_elongated_few_small') },
    { value: 'several_large_gt2_5cm', label: t('symptom_elongated_several_large') },
    { value: 'many_all_sizes', label: t('symptom_elongated_many') },
  ];
}

export function getHoleOptions(t: TranslationFn): ReadonlyArray<Option<HoleBand>> {
  return [
    { value: 'none', label: t('symptom_none') },
    { value: 'few_small_mid', label: t('symptom_hole_few_small_mid') },
    { value: 'several_large', label: t('symptom_hole_several_large') },
    { value: 'many_mid_large', label: t('symptom_hole_many_mid_large') },
  ];
}

export function getWhorlDamageOptions(t: TranslationFn): ReadonlyArray<Option<WhorlFurlDestruction>> {
  return [
    { value: 'none', label: t('symptom_none') },
    { value: 'partial', label: t('symptom_whorl_partial') },
    { value: 'almost_total', label: t('symptom_whorl_almost_total') },
  ];
}

export function getOptionLabel<T extends string | number>(
  options: ReadonlyArray<Option<T>>,
  value: T,
  fallback = String(value),
): string {
  return options.find((option) => option.value === value)?.label ?? fallback;
}
