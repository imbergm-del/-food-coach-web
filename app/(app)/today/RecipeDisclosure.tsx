type Ingredient = { name: string; qty: string };

export function RecipeDisclosure({ ingredients, steps }: { ingredients: Ingredient[]; steps: string[] }) {
  if (ingredients.length === 0 && steps.length === 0) return null;

  return (
    <div className="card" style={{ background: "var(--paper2)", boxShadow: "none", marginBottom: 16 }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>Рецепт</div>

      {ingredients.length > 0 && (
        <div style={{ marginBottom: steps.length > 0 ? 14 : 0 }}>
          {ingredients.map(i => (
            <div key={i.name} className="listrow" style={{ padding: "7px 0" }}>
              <span style={{ fontSize: 14 }}>{i.name}</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-soft)" }}>{i.qty}</span>
            </div>
          ))}
        </div>
      )}

      {steps.length > 0 && (
        <ol style={{ margin: 0, padding: "0 0 0 20px" }}>
          {steps.map((step, i) => (
            <li key={i} style={{ fontSize: 14.5, color: "var(--ink-soft)", marginBottom: 8, lineHeight: 1.5 }}>
              {step}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
