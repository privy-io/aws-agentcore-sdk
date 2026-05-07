import { type ReactNode } from "react";
import { Check } from "lucide-react";

type SetupCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  completed?: boolean;
  onClick?: () => void;
};

export function SetupCard({
  title,
  description,
  icon,
  completed,
  onClick,
}: SetupCardProps) {
  const isHighlighted = completed === true;

  return (
    <article
      onClick={onClick}
      className={`flex flex-col gap-4 rounded-2xl border px-6 py-5 transition-colors ${
        isHighlighted
          ? "border-[#87d7b7] bg-[#dcfce7]"
          : onClick
            ? "cursor-pointer border-[#e2e3f0] bg-white hover:bg-[#f8f9fc]"
            : "border-[#e2e3f0] bg-white"
      }`}
    >
      <div className="self-start">
        {isHighlighted ? <Check className="size-5 text-[#16A34A]" /> : icon}
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-[#040217]">{title}</h2>
        <p className="text-sm leading-snug text-[#64668b]">{description}</p>
      </div>
    </article>
  );
}
