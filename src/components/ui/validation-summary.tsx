interface ValidationSummaryProps {
  errors: Record<string, string>;
  title?: string;
}

/**
 * Validation Summary Component
 * Displays all validation errors in a consolidated banner at the top of forms
 */
export function ValidationSummary({ errors, title = "Please fix the following errors:" }: ValidationSummaryProps) {
  const errorEntries = Object.entries(errors);
  
  if (errorEntries.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-900">{title}</h3>
          <ul className="mt-2 space-y-1 text-sm text-red-800">
            {errorEntries.map(([field, message]) => (
              <li key={field} className="flex items-start gap-2">
                <span className="text-red-600">•</span>
                <span>
                  <strong className="capitalize">{field}:</strong> {message}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
