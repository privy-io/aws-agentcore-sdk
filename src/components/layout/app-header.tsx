import { AwsWordmark } from "@/components/ui/aws-wordmark";
import { UserMenu } from "@/components/layout/user-menu";

export function AppHeader() {
  return (
    <header className="flex h-16 items-center justify-between bg-[#111826] px-6">
      <AwsWordmark />
      <UserMenu />
    </header>
  );
}
