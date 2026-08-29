import { getLang } from "@/lib/language";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return <LoginForm lang={getLang()} />;
}
