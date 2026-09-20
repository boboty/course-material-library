/* BenYan AI — Web UI kit: course showcase site
   Composes the design-system components from the compiled bundle. */
const DS = window.BenYanAIDesignSystem_5a2b7b;
const { Button, Eyebrow, Badge, Tag, CaseCard, Metric, Tabs, Avatar } = DS;

const LOGO = '../../assets/logo-appicon.png';

/* ---------------- Header ---------------- */
function Header({ onBook }) {
  const nav = ['课程体系', '实战案例', '方法论', '师资'];
  const [active, setActive] = React.useState('课程体系');
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(247,250,248,0.82)', backdropFilter: 'blur(14px)', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px', height: 68, display: 'flex', alignItems: 'center', gap: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0 }}>
          <img src={LOGO} alt="" style={{ height: 34, borderRadius: 9 }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, letterSpacing: '-.01em', color: 'var(--text-strong)', whiteSpace: 'nowrap' }}>BenYan<span style={{ color: 'var(--brand)' }}> AI</span></span>
        </div>
        <nav style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
          {nav.map((n) => (
            <button key={n} onClick={() => setActive(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 14px', borderRadius: 8, fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: active === n ? 600 : 500, color: active === n ? 'var(--text-strong)' : 'var(--text-muted)' }}>{n}</button>
          ))}
        </nav>
        <div style={{ flex: 1 }} />
        <Button variant="ghost" size="sm">登录</Button>
        <Button variant="primary" size="sm" onClick={onBook}>预约企业内训</Button>
      </div>
    </header>
  );
}

/* ---------------- Hero ---------------- */
function Hero({ onBook }) {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', background: 'var(--grad-dark)', color: '#fff' }}>
      <span style={{ position: 'absolute', right: -120, top: -160, width: 560, height: 860, background: 'var(--grad-wing)', opacity: .16, transform: 'rotate(10deg)' }} />
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '92px 32px 84px', position: 'relative', zIndex: 2 }}>
        <Eyebrow tone="onDark">企业 AI 赋能 · 课程与咨询</Eyebrow>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 64, lineHeight: 1.06, letterSpacing: '-.025em', color: '#fff', margin: '22px 0 0', maxWidth: 820 }}>
          把 AI 能力，<br/>沉淀为企业的<span style={{ color: 'var(--emerald-300)' }}>工作流</span>
        </h1>
        <p style={{ fontSize: 21, lineHeight: 1.6, color: 'rgba(255,255,255,.82)', maxWidth: 620, marginTop: 24 }}>
          面向研发、产品与管理团队的体系化课程。从认知校准到场景落地，配套真实案例、评估清单与可复用模板。
        </p>
        <div style={{ display: 'flex', gap: 14, marginTop: 36 }}>
          <Button variant="primary" size="lg" onClick={onBook} iconRight="→">预约内训诊断</Button>
          <Button variant="secondary" size="lg" style={{ background: 'rgba(255,255,255,.06)', color: '#fff', borderColor: 'rgba(255,255,255,.22)' }}>查看课程大纲</Button>
        </div>
        <div style={{ display: 'flex', gap: 40, marginTop: 56 }}>
          {[['120+', '服务企业'], ['8,000+', '学员'], ['4.9/5', '满意度']].map(([v, l]) => (
            <div key={l}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 30, color: 'var(--emerald-300)', letterSpacing: '-.02em' }}>{v}</div>
              <div style={{ fontSize: 14, color: 'var(--text-on-dark-muted)', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

window.WebKitParts = { Header, Hero };
