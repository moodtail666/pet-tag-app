import Link from "next/link";

export default function AdminTagsPage() {
  return (
    <section className="card">
      <h1>管理员吊牌工具</h1>
      <div className="notice warn">管理员写入入口已暂时关闭，防止未授权用户批量生成吊牌。</div>
      <p className="muted">用户注册、吊牌激活和宠物资料功能不受影响。管理员批量制牌会使用单独的安全入口。</p>
      <Link className="button secondary" href="/dashboard">返回我的宠物</Link>
    </section>
  );
}
