import Link from "next/link";
import { createClient } from "@/lib/supabaseServer";
import { checkoutCart, removeCartItem } from "./actions";

export default async function CartPage({ searchParams }: { searchParams: { tab?: string } }) {
  const activeTab = searchParams.tab === "fridge" ? "fridge" : "list";
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: cartItems } = await supabase.from("cart_items").select("*").eq("user_id", user!.id).order("id");
  const { data: groceryItems } = await supabase.from("grocery_items").select("*").eq("user_id", user!.id).order("id");
  const { data: fridgeItems } = await supabase.from("fridge_items").select("*").eq("user_id", user!.id).order("id");

  const groups: Record<string, typeof groceryItems> = { need: [], have: [], low_stock: [] };
  groceryItems?.forEach(g => { (groups[g.status] ??= []).push(g); });
  const labels: Record<string, string> = { need: "Купить", have: "Уже есть", low_stock: "Заканчивается" };
  const lowStock = fridgeItems?.filter(f => f.quantity === "мало") ?? [];

  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 6 }}>Корзина и покупки</div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Что нужно купить</h1>

      <div className="tabs">
        <Link href="/cart?tab=list" className={`tab ${activeTab === "list" ? "active" : ""}`}>Список</Link>
        <Link href="/cart?tab=fridge" className={`tab ${activeTab === "fridge" ? "active" : ""}`}>Мой холодильник</Link>
      </div>

      {activeTab === "list" ? (
        <>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Из заказанных блюд ({cartItems?.length ?? 0})</div>
          <div className="card" style={{ marginBottom: 16 }}>
            {cartItems?.length ? cartItems.map(c => (
              <div key={c.id} className="listrow">
                <span>{c.name}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{c.quantity}</span>
                  <form action={removeCartItem}>
                    <input type="hidden" name="id" value={c.id} />
                    <button className="btn ghost" style={{ padding: "4px 9px" }} type="submit">×</button>
                  </form>
                </span>
              </div>
            )) : (
              <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>
                Пока пусто. Нажмите «Заказать продукты» на экране Сегодня.
              </p>
            )}
          </div>

          {!!cartItems?.length && (
            <form action={checkoutCart} style={{ marginBottom: 20 }}>
              <button className="btn block" type="submit">Добавить всё в список покупок</button>
            </form>
          )}

          {Object.entries(groups).map(([key, items]) => (
            <div key={key}>
              <div className="eyebrow" style={{ margin: "16px 0 8px" }}>{labels[key]}</div>
              <div className="card">
                {items && items.length ? items.map(i => (
                  <div key={i.id} className="listrow"><span>{i.name}</span></div>
                )) : <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>Пусто.</p>}
              </div>
            </div>
          ))}
        </>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 14 }}>
            {fridgeItems?.length ? fridgeItems.map(f => (
              <div key={f.id} className="listrow">
                <span>{f.name}</span>
                <span className="macrolabel" style={f.quantity === "мало" ? { color: "var(--warn)" } : undefined}>{f.quantity}</span>
              </div>
            )) : <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>Пока пусто.</p>}
          </div>
          {!!lowStock.length && (
            <div className="card" style={{ borderColor: "var(--warn)" }}>
              <p style={{ fontSize: 13.5, margin: "0 0 10px" }}>
                Заканчивается: {lowStock.map(f => f.name).join(", ")}. Этого не хватит на план недели.
              </p>
              <Link href="/cart?tab=list" className="btn block" style={{ textAlign: "center" }}>Добавить в список покупок</Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
