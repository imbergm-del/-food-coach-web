import { createClient } from "@/lib/supabaseServer";
import { removeGroceryItem } from "./actions";
import { GroceryCheckbox } from "./GroceryCheckbox";
import { SubmitButton } from "@/components/SubmitButton";
import { getLang } from "@/lib/language";
import { cart as dict, t } from "@/lib/i18n";

export default async function CartPage() {
  const lang = getLang();
  const tr = (key: string) => t(dict, lang, key);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: items } = await supabase
    .from("grocery_items").select("*").eq("user_id", user!.id)
    .order("bought").order("id");

  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 6 }}>{tr("eyebrow")}</div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>{tr("title")}</h1>

      <div className="card">
        {items?.length ? items.map(i => (
          <div key={i.id} className="listrow" style={{ opacity: i.bought ? 0.5 : 1 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, cursor: "pointer" }}>
              <GroceryCheckbox id={i.id} initialBought={!!i.bought} />
              <span style={{
                textDecoration: i.bought ? "line-through" : "none",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
              }}>
                {i.name}
              </span>
            </label>
            <span style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              {i.quantity && <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-soft)" }}>{i.quantity}</span>}
              <form action={removeGroceryItem}>
                <input type="hidden" name="id" value={i.id} />
                <SubmitButton className="btn ghost" style={{ padding: "4px 9px" }} pendingText="">×</SubmitButton>
              </form>
            </span>
          </div>
        )) : (
          <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>
            {tr("empty")}
          </p>
        )}
      </div>
    </div>
  );
}
