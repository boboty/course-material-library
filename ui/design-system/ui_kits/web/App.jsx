/* BenYan AI — Web UI kit: App shell + booking modal */
const DSa = window.BenYanAIDesignSystem_5a2b7b;

function BookingModal({ open, onClose }) {
  const { Button, Eyebrow } = DSa;
  const [sent, setSent] = React.useState(false);
  React.useEffect(() => { if (open) setSent(false); }, [open]);
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(20,27,33,.46)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 480, maxWidth: '100%', background: 'var(--surface-card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', padding: 34, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', fontSize: 22, color: 'var(--text-faint)', cursor: 'pointer' }}>×</button>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: 999, background: 'var(--surface-brand-soft)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 18px' }}>✓</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, margin: '0 0 8px', color: 'var(--text-strong)' }}>已收到，谢谢！</h3>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 24px' }}>顾问将在 1 个工作日内与你联系。</p>
            <Button variant="primary" onClick={onClose}>好的</Button>
          </div>
        ) : (
          <React.Fragment>
            <Eyebrow>预约内训诊断</Eyebrow>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, letterSpacing: '-.02em', margin: '14px 0 6px', color: 'var(--text-strong)' }}>留下信息，开始对话</h3>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 22px', fontSize: 15 }}>我们将为你定制一次 60 分钟的场景诊断。</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[['企业名称', '如：BenYan 科技'], ['联系人', '你的称呼'], ['联系方式', '手机 / 邮箱']].map(([l, ph]) => (
                <label key={l} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-body)' }}>{l}</span>
                  <input placeholder={ph} style={{ height: 44, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'var(--paper)', padding: '0 14px', fontSize: 15, fontFamily: 'var(--font-sans)', color: 'var(--text-body)', outline: 'none' }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--brand)'; e.target.style.boxShadow = 'var(--ring-brand)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none'; }} />
                </label>
              ))}
            </div>
            <div style={{ marginTop: 24 }}><Button variant="primary" size="lg" full onClick={() => setSent(true)}>提交预约</Button></div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

function App() {
  const { Header, Hero } = window.WebKitParts;
  const { Courses, Cases, Footer } = window.WebKitParts2;
  const [open, setOpen] = React.useState(false);
  const book = () => setOpen(true);
  return (
    <div>
      <Header onBook={book} />
      <Hero onBook={book} />
      <Courses />
      <Cases />
      <Footer onBook={book} />
      <BookingModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
