import Link from "next/link";

export default function HomePage() {
  return (
    <section className="card">
      <h1>扫码激活宠物吊牌，帮宠物更快回家。</h1>
      <p className="muted">
        主人用 Tag ID 和激活码绑定吊牌，填写宠物资料。别人扫码后可以查看公开资料，并把当前位置发送给主人。
      </p>
      <div className="actions">
        <Link className="button" href="/activate">激活吊牌</Link>
        <Link className="button secondary" href="/pet/10000001">查看公开页示例</Link>
      </div>
    </section>
  );
}
