"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#FAFAFA]">
      <p className="text-2xl font-semibold text-[#040217]">
        Something went wrong.
      </p>
      <p className="text-sm text-[#64668b]">
        An unexpected error occurred. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 inline-flex h-10 items-center rounded-xl bg-[#111826] px-5 text-sm font-medium text-white transition-colors hover:bg-[#1a2436]"
      >
        Try again
      </button>
    </div>
  );
}
