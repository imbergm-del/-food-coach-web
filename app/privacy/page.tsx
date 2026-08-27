export const metadata = { title: "Политика конфиденциальности — AI Food Coach" };

export default function PrivacyPage() {
  return (
    <div className="shell">
      <div className="screen">
        <div className="eyebrow" style={{ marginBottom: 6 }}>AI Food Coach</div>
        <h1 style={{ fontSize: 24, marginBottom: 20 }}>Политика конфиденциальности</h1>

        <div className="card" style={{ marginBottom: 14 }}>
          <p style={{ margin: "0 0 10px" }}>
            Мы собираем только те данные, которые нужны, чтобы вести ваш план питания: email, имя,
            телефон (если вы включили SMS-напоминания), возраст, вес, рост, часовой пояс и историю
            приёмов пищи, которые вы записываете в приложении.
          </p>
          <p style={{ margin: "0 0 10px" }}>
            Эти данные хранятся в базе данных проекта (Supabase) и используются только для работы
            приложения: расчёта нормы КБЖУ, подбора блюд и отправки напоминаний, которые вы сами
            включили в настройках. Мы не продаём и не передаём ваши данные третьим лицам.
          </p>
          <p style={{ margin: "0 0 10px" }}>
            Вход через Google используется только для авторизации — мы получаем от Google ваш email
            и имя, ничего больше.
          </p>
          <p style={{ margin: 0 }}>
            Вы можете в любой момент попросить удалить свой аккаунт и все данные, написав на{" "}
            <a href="mailto:imbergm@gmail.com">imbergm@gmail.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
