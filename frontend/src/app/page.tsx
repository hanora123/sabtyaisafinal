import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>نقطة البيع + المخزون + المحاسبة</h1>
          <p>
            هذا هيكل مشروع جاهز للويب فقط، بخلفية NestJS وواجهة Next.js. استخدم
            القائمة أعلاه للانتقال إلى نقطة البيع أو الإدارة أو تسجيل الدخول.
          </p>
        </div>

        <div
          className={styles.ctas}
          style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}
        >
          <Link className={styles.primary} style={{ padding: "12px 16px" }} href="/pos">
            افتح نقطة البيع
          </Link>
          <Link className={styles.secondary} style={{ padding: "12px 16px" }} href="/admin">
            لوحة الإدارة
          </Link>
          <Link className={styles.secondary} style={{ padding: "12px 16px" }} href="/login">
            تسجيل الدخول
          </Link>
        </div>
      </main>
    </div>
  );
}
