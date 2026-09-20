import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { Button } from '../../../ui/design-system/components/core/Button.jsx'
import { Badge } from '../../../ui/design-system/components/core/Badge.jsx'
import { Card } from '../../../ui/design-system/components/surfaces/Card.jsx'
import { Callout } from '../../../ui/design-system/components/surfaces/Callout.jsx'
import { createMaterial, findExactTitle, getMaterial, listMaterials, type Material, type MaterialPage } from '../api/materials'

const types = ['故事', '案例', 'Demo', '金句', '段子', '行业素材']

export function MaterialList() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const page = Math.max(1, Number(params.get('page') || '1') || 1)
  const [input, setInput] = useState(q)
  const [result, setResult] = useState<MaterialPage | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    listMaterials(q, page).then(data => { if (active) { setResult(data); setError('') } })
      .catch(() => { if (active) setError('素材列表加载失败') })
    return () => { active = false }
  }, [q, page])
  return <main className="material-page by-container">
    <header className="page-header"><div><div className="by-eyebrow by-eyebrow--tick">课程素材库</div><h1>素材列表</h1><p className="by-lead">随手记录，随时找回。</p></div><Link className="primary-link" to="/materials/new">快速录入</Link></header>
    <form className="search-row" onSubmit={event => { event.preventDefault(); setParams({ q: input.trim(), page: '1' }) }}>
      <label htmlFor="material-search">搜索标题</label><input id="material-search" value={input} onChange={event => setInput(event.target.value)} /><Button type="submit">搜索</Button>
    </form>
    {error && <Callout tone="risk">{error}</Callout>}
    {result && <><p className="result-count">共 {result.total} 条素材</p><div className="material-grid">
      {result.items.map(material => <Link key={material.id} to={`/materials/${material.id}`} className="material-link"><Card interactive accent><div className="material-card-top"><h2>{material.title}</h2><Badge>{material.status}</Badge></div><p>{material.type || '未填写类型'}</p></Card></Link>)}
    </div>{result.total === 0 && <p>没有找到素材。</p>}<nav className="pager" aria-label="分页"><Button variant="secondary" disabled={page <= 1} onClick={() => setParams({ q, page: String(page - 1) })}>上一页</Button><span>第 {page} 页</span><Button variant="secondary" disabled={page * result.page_size >= result.total} onClick={() => setParams({ q, page: String(page + 1) })}>下一页</Button></nav></>}
  </main>
}

export function MaterialCreate() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [type, setType] = useState('')
  const [body, setBody] = useState('')
  const [duplicate, setDuplicate] = useState<Material | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (!title.trim()) { setDuplicate(null); return }
    let active = true
    setDuplicate(null)
    const timer = setTimeout(() => { findExactTitle(title.trim()).then(item => { if (active) setDuplicate(item) }).catch(() => { if (active) setDuplicate(null) }) }, 250)
    return () => { active = false; clearTimeout(timer) }
  }, [title])
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setSaving(true)
    try { const material = await createMaterial({ title, type, body }); navigate(`/materials/${material.id}`) }
    catch (reason) { setError(reason instanceof Error ? reason.message : '保存失败') }
    finally { setSaving(false) }
  }
  return <main className="material-page by-container"><Link to="/materials">← 返回素材列表</Link><div className="by-eyebrow by-eyebrow--tick">快速录入</div><h1>记录一条素材</h1><p className="by-lead">只需标题、类型和正文。保存后为草稿。</p>
    <Card accent className="form-card"><form onSubmit={submit} className="material-form"><label>标题<input required maxLength={255} value={title} onChange={event => setTitle(event.target.value)} /></label>
      {duplicate && <Callout tone="warning">已有同标题素材，仍可继续保存。<Link to={`/materials/${duplicate.id}`}>查看已有素材</Link></Callout>}
      <label>类型<select required value={type} onChange={event => setType(event.target.value)}><option value="">请选择类型</option>{types.map(item => <option key={item}>{item}</option>)}</select></label>
      <label>正文<textarea required rows={8} value={body} onChange={event => setBody(event.target.value)} /></label>
      {error && <Callout tone="risk">{error}</Callout>}<Button type="submit" disabled={saving}>{saving ? '保存中…' : '保存草稿'}</Button></form></Card>
  </main>
}

export function MaterialDetail() {
  const { id = '' } = useParams()
  const [material, setMaterial] = useState<Material | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { getMaterial(id).then(setMaterial).catch(reason => setError(reason instanceof Error ? reason.message : '素材加载失败')) }, [id])
  return <main className="material-page by-container"><Link to="/materials">← 返回素材列表</Link>{error && <Callout tone="risk">{error}</Callout>}{material && <><div className="by-eyebrow by-eyebrow--tick">素材详情</div><div className="detail-title"><h1>{material.title}</h1><Badge>{material.status}</Badge></div><p className="by-lead">{material.type || '未填写类型'}</p><Card accent className="detail-body"><h2>正文</h2><p>{material.body || '尚未填写正文'}</p></Card></>}</main>
}
