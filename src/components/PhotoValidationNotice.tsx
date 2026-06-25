import type { PhotoValidationResult } from '@/lib/photoValidation';

type PhotoValidationNoticeProps = {
  validation: PhotoValidationResult | null;
  isValidating: boolean;
};

export default function PhotoValidationNotice({
  validation,
  isValidating,
}: PhotoValidationNoticeProps) {
  if (isValidating) {
    return (
      <p className="mt-2 rounded-md bg-[color:var(--surface-muted)] p-3 text-sm text-[color:var(--foreground)]">
        Checking the photo for basic quality and content issues...
      </p>
    );
  }

  if (!validation || validation.warnings.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <p className="font-semibold">Photo warning</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {validation.warnings.map((warning) => (
          <li key={warning.kind}>
            <span className="font-medium">{warning.title}:</span> {warning.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
