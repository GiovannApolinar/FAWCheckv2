'use client';

import { useEffect, useState } from 'react';
import { type PhotoValidationResult, validatePhoto } from '@/lib/photoValidation';

type UsePhotoValidationResult = {
  validation: PhotoValidationResult | null;
  isValidating: boolean;
};

export function usePhotoValidation(source: string | null | undefined): UsePhotoValidationResult {
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

    setValidation(null);
    setIsValidating(true);

    void validatePhoto(source)
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
