'use client';

export function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
      {message && <p className="text-sm text-neutral-500">{message}</p>}
    </div>
  );
}