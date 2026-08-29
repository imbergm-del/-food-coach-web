import { getLang } from "@/lib/language";
import { OnboardingForm } from "./OnboardingForm";

export default function OnboardingPage() {
  return <OnboardingForm lang={getLang()} />;
}
