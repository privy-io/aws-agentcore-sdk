import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#FAFAFA]">
      <p className="text-5xl font-semibold text-[#040217]">404</p>
      <p className="text-base text-[#64668b]">Page not found.</p>
      <Link
        href="/"
        className="mt-2 text-sm font-medium text-[#040217] underline underline-offset-4 hover:opacity-70"
      >
        Go home
      </Link>
    </div>
  );
}
