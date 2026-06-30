'use client';

import { useEffect, useState } from 'react';
import { type PhotoValidationResult, type ValidationStrings, validatePhoto } from '@/lib/photoValidation';
import { useLocale } from '@/hooks/useLocale';

type UsePhotoValidationResult = {
  validation: PhotoValidationResult | null;
  isValidating: boolean;
};

export function usePhotoValidation(source: string | null | undefined): UsePhotoValidationResult {
  const { t } = useLocale();
  const [validation, setValidation] = useState<PhotoValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!source) {
      setValidation(null);
      setIsValidating(false);
      return () => {
        cancelled = true;
      };
    }

    const strings: ValidationStrings = {
      unusableTitle: t('validation_unusable_title'),
      unusableMessagePrefix: t('validation_unusable_msg_prefix'),
      unusableMessageSuffix: t('validation_unusable_msg_suffix'),
      reasonTooSmall: t('validation_reason_too_small'),
      reasonBlurry: t('validation_reason_blurry'),
      reasonTooDark: t('validation_reason_too_dark'),
      reasonTooBright: t('validation_reason_too_bright'),
      reasonLowContrast: t('validation_reason_low_contrast'),
      conjunction: t('validation_conjunction_and'),
      notMaizeTitle: t('validation_not_maize_title'),
      notMaizeLabelPre: t('validation_not_maize_label_pre'),
      notMaizePlantPost: t('validation_not_maize_plant_post'),
      notMaizeNonPlantPost: t('validation_not_maize_nonplant_post'),
      notMaizeNoVegetation: t('validation_not_maize_no_vegetation'),
    };

    setValidation(null);
    setIsValidating(true);

    void validatePhoto(source, strings)
      .then((result) => {
        if (!cancelled) {
          setValidation(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setValidation(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsValidating(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [source]);

  return { validation, isValidating };
}
