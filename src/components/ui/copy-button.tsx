"use client";

import { useState, type MouseEvent } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick(e: MouseEvent) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  }

  return copied ? (
    <Check
      className="size-4 shrink-0 cursor-pointer text-[#16A34A]"
      onClick={handleClick}
    />
  ) : (
    <Copy
      className="size-4 shrink-0 cursor-pointer text-[#64668b]"
      onClick={handleClick}
    />
  );
}
