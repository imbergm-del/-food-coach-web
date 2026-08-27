import { BottomNav } from "@/components/BottomNav";
import { TimezoneSync } from "@/components/TimezoneSync";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <TimezoneSync />
      <div className="screen">{children}</div>
      <BottomNav />
    </div>
  );
}
