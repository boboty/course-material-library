/* BenYan AI — Web UI kit: courses, cases, footer */
const DS2 = window.BenYanAIDesignSystem_5a2b7b;

const COURSES = [
  { code: 'C-01', title: 'AI 洞察及应用', desc: '校准认知，建立 AI 机会地图与判断框架。', dur: '2 天', level: '管理层', tags: ['认知校准', '机会识别'] },
  { code: 'C-02', title: 'AI 研发体系建设', desc: '把 AI 编码与协作沉淀为工程化、可度量的能力。', dur: '3 天', level: '研发团队', tags: ['工程化', '质量门禁'] },
  { code: 'C-03', title: '企业 AI 应用场景设计', desc: '从场景识别到价值评估，设计可落地的工作流。', dur: '2 天', level: '产品/业务', tags: ['场景设计', 'ROI 评估'] },
];

function Courses() {
  const { Eyebrow, Tag } = DS2;
  return (
    <section style={{ maxWidth: 1180, margin: '0 auto', padding: '88px 32px 40px' }}>
      <Eyebrow>课程体系 · Curriculum</Eyebrow>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40, letterSpacing: '-.022em', color: 'var(--text-strong)', margin: '16px 0 8px' }}>三门课，一条落地主线</h2>
      <p style={{ fontSize: 18, color: 'var(--text-muted)', margin: '0 0 40px', maxWidth: 560 }}>模块可独立交付，也可组合为企业 AI 转型的完整研修路径。</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22 }}>
        {COURSES.map((c) => (
          <div key={c.code} className="hovcard" style={{ position: 'relative', background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: 26, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden', transition: 'transform .2s, box-shadow .2s' }}>
            <span style={{ position: 'absolute', top: 0, left: 0, height: 3, width: 48, background: 'var(--brand)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-faint)', letterSpacing: '.06em' }}>{c.code}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--emerald-700)', background: 'var(--surface-brand-soft)', border: '1px solid var(--emerald-200)', borderRadius: 999, padding: '2px 10px' }}>{c.dur} · {c.level}</span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--text-strong)', margin: 0 }}>{c.title}</h3>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-muted)', margin: 0, flex: 1 }}>{c.desc}</p>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>{c.tags.map((t) => <Tag key={t}>{t}</Tag>)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

const CASES = [
  { id: 'fin', cat: '金融', industry: '金融 · 风控', status: '12 周 · 已交付', title: '智能信贷审核助手', summary: '大模型嵌入审批流，自动抽取要素并生成初核意见。', metrics: [{ value: '+38%', label: '审核效率' }, { value: '4.2×', label: 'ROI' }], tags: ['研发提效', '风控'] },
  { id: 'mfg', cat: '制造', industry: '制造 · 质检', status: '8 周 · 试点', title: '产线缺陷知识助手', summary: '统一质检知识库，新人上手周期大幅缩短。', metrics: [{ value: '-52%', label: '培训周期' }, { value: '3.1×', label: '检索效率' }], tags: ['知识库', '提效'] },
  { id: 'ret', cat: '零售', industry: '零售 · 营销', status: '6 周 · 已交付', title: '营销内容生成工作流', summary: '从选题到合规审校的端到端内容流水线。', metrics: [{ value: '5×', label: '产出速度' }, { value: '+22%', label: '转化率' }], tags: ['内容', '工作流'] },
  { id: 'fin2', cat: '金融', industry: '金融 · 投研', status: '10 周 · 规模化', title: '研报智能摘要平台', summary: '海量研报结构化摘要，辅助投研快速决策。', metrics: [{ value: '70%', label: '阅读耗时↓' }, { value: '4.5×', label: '覆盖广度' }], tags: ['投研', 'RAG'] },
];

function Cases() {
  const { Eyebrow, Tabs, CaseCard } = DS2;
  const [f, setF] = React.useState('all');
  const list = f === 'all' ? CASES : CASES.filter((c) => c.cat === ({ fin: '金融', mfg: '制造', ret: '零售' }[f]));
  return (
    <section style={{ background: 'var(--surface-sunken)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '88px 32px' }}>
        <Eyebrow>实战案例 · Case Library</Eyebrow>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, margin: '16px 0 28px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40, letterSpacing: '-.022em', color: 'var(--text-strong)', margin: 0 }}>跨行业的可复用方法</h2>
          <div style={{ minWidth: 320 }}>
            <Tabs value={f} onChange={setF} items={[{ id: 'all', label: '全部', badge: CASES.length }, { id: 'fin', label: '金融' }, { id: 'mfg', label: '制造' }, { id: 'ret', label: '零售' }]} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 22 }}>
          {list.map((c) => (
            <CaseCard key={c.id} industry={c.industry} status={c.status} title={c.title} summary={c.summary} metrics={c.metrics} tags={c.tags} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer({ onBook }) {
  const { Button } = DS2;
  return (
    <footer style={{ background: 'var(--grad-dark)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      <span style={{ position: 'absolute', left: -120, bottom: -200, width: 560, height: 760, background: 'var(--grad-wing)', opacity: .14, transform: 'rotate(-12deg)' }} />
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '76px 32px', position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 32 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 44, letterSpacing: '-.025em', color: '#fff', margin: 0, lineHeight: 1.1 }}>为团队设计<br/>一条 AI 落地路径</h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,.78)', marginTop: 18, maxWidth: 440 }}>预约 60 分钟诊断，我们一起梳理你的高价值场景。</p>
          <div style={{ marginTop: 28 }}><Button variant="primary" size="lg" onClick={onBook} iconRight="→">预约内训诊断</Button></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, opacity: .9 }}>
          <img src="../../assets/logo-appicon.png" alt="" style={{ height: 30, borderRadius: 8 }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>BenYan<span style={{ color: 'var(--emerald-400)' }}> AI</span></span>
        </div>
      </div>
    </footer>
  );
}

window.WebKitParts2 = { Courses, Cases, Footer };
