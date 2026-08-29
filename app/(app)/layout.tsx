import { BottomNav } from "@/components/BottomNav";
import { TimezoneSync } from "@/components/TimezoneSync";
import { getLang } from "@/lib/language";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <TimezoneSync />
      <div className="screen">{children}</div>
      <BottomNav lang={getLang()} />
    </div>
  );
}
