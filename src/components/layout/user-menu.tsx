"use client";

import { useRef, useState, useEffect } from "react";
import { CircleUser, LogOut } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

export function UserMenu() {
  const { logout, user } = usePrivy();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: globalThis.MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const email =
    user?.email?.address ??
    user?.google?.email ??
    (
      user?.linkedAccounts?.find((a) => a.type === "email") as
        | { address?: string }
        | undefined
    )?.address ??
    null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full p-0.5 transition-opacity hover:opacity-80"
        aria-label="User menu"
        aria-expanded={open}
      >
        <CircleUser className="size-7 text-white" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-[#e2e3f0] bg-white py-1 shadow-lg">
          {email && (
            <>
              <div className="px-3 py-2">
                <p className="truncate text-xs text-[#64668b]">{email}</p>
              </div>
              <div className="mx-3 border-t border-[#e2e3f0]" />
            </>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#040217] transition-colors hover:bg-[#f8f9fc]"
          >
            <LogOut className="size-4 text-[#64668b]" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
