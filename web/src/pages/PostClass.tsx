import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { Button } from '../../../ui/design-system/components/core/Button.jsx'
import { Badge } from '../../../ui/design-system/components/core/Badge.jsx'
import { Card } from '../../../ui/design-system/components/surfaces/Card.jsx'
import { Callout } from '../../../ui/design-system/components/surfaces/Callout.jsx'
import { ApiError } from '../api/client'
import { listMaterials, type Material } from '../api/materials'
import { savePostClass, type UsageEdit } from '../api/postClass'
import { getSession, type TeachingSession } from '../api/sessions'
import { listUsages, type Usage } from '../api/usages'
import { materialStatusBadge } from '../ui/statusBadge'

type Draft = { key: string; usage?: Usage; material: Material | { id: string; title: string }; result: UsageEdit }

export function PostClass() {
  const { id = '' } = useParams()
  const [session, setSession] = useState<TeachingSession | null>(null)
  const [rows, setRows] = useState<Draft[]>([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Material[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([getSession(id), listUsages(id)]).then(([info, usages]) => {
      if (!active) return
      setSession(info)
      setRows(usages.map(usage => ({ key: usage.id, usage, material: usage.material,
        result: { id: usage.id, status: usage.status === '未用' ? '未用' : '已用',
          effect: usage.effect as UsageEdit['effect'], reaction: usage.reaction } })))
    }).catch(() => { if (active) setError('课后登记加载失败') })
    return () => { active = false }
  }, [id])

  function update(key: string, patch: Partial<UsageEdit>) {
    setSaved(false)
    setRows(current => current.map(row => row.key === key ? { ...row, result: {
      ...row.result, ...patch, ...(patch.status === '未用' ? { effect: '未评' as const, reaction: null } : {}),
    } } : row))
  }

  async function search(event: FormEvent) {
    event.preventDefault(); setError('')
    try { setResults((await listMaterials(query.trim())).items) }
    catch { setError('素材搜索失败') }
  }

  function addExisting(material: Material) {
    if (rows.some(row => row.material.id === material.id)) return
    setRows(current => [...current, { key: `existing:${material.id}`, material,
      result: { id: '', status: '已用', effect: '未评', reaction: null } }])
    setSaved(false)
  }

  function addNew(event: FormEvent) {
    event.preventDefault()
    const title = newTitle.trim()
    if (!title || title.length > 255) { setError('标题需为 1 至 255 个字符'); return }
    setRows(current => [...current, { key: `new:${crypto.randomUUID()}`, material: { id: '', title },
      result: { id: '', status: '已用', effect: '未评', reaction: null } }])
    setNewTitle(''); setError(''); setSaved(false)
  }

  async function save() {
    setSaving(true); setError(''); setSaved(false)
    try {
      const actual = await savePostClass(id, {
        usages: rows.filter(row => row.usage).map(row => row.result),
        existing_materials: rows.filter(row => row.key.startsWith('existing:')).map(row => ({
          material_id: row.material.id, effect: row.result.effect, reaction: row.result.reaction,
        })),
        new_materials: rows.filter(row => row.key.startsWith('new:')).map(row => ({
          title: row.material.title, effect: row.result.effect, reaction: row.result.reaction,
        })),
      })
      setRows(actual.map(usage => ({ key: usage.id, usage, material: usage.material,
        result: { id: usage.id, status: usage.status as UsageEdit['status'],
          effect: usage.effect as UsageEdit['effect'], reaction: usage.reaction } })))
      setSaved(true)
    } catch (reason) { setError(reason instanceof ApiError ? reason.message : '保存课后登记失败') }
    finally { setSaving(false) }
  }

  const usedCount = rows.filter(row => row.result.status === '已用').length
  const unusedCount = rows.filter(row => row.result.status === '未用').length

  return <main className="material-page by-container"><Link to={`/sessions/${id}`}>← 返回场次详情</Link>
    <div className="by-eyebrow by-eyebrow--tick">课后登记</div><h1>保存实际使用情况</h1>
    <p className="by-lead">{session ? `${session.session_date} · ${session.customer.name} · ${session.course.name}` : '场次信息加载中…'}</p>
    <p>所有修改会在点击“保存课后登记”后一起保存。</p>
    {rows.map(row => <Card key={row.key} className="detail-body post-class-card">
      <h2>{row.material.title}</h2>
      {!row.usage && <p className="record-meta">现场临时补记 · 尚未保存</p>}
      <div className="post-class-controls"><label>使用状态<select value={row.result.status} onChange={event => update(row.key, { status: event.target.value as UsageEdit['status'] })} disabled={!row.usage}>
        <option>已用</option>{row.usage && <option>未用</option>}
      </select></label>
      {row.result.status === '已用' && <><label>效果<select value={row.result.effect} onChange={event => update(row.key, { effect: event.target.value as UsageEdit['effect'] })}>
        <option>未评</option><option>好</option><option>差</option>
      </select></label><label>现场反应<textarea rows={2} value={row.result.reaction ?? ''} onChange={event => update(row.key, { reaction: event.target.value })} /></label></>}
      </div>
      {!row.usage && <Button variant="secondary" size="sm" onClick={() => setRows(current => current.filter(item => item.key !== row.key))}>移除补记</Button>}
    </Card>)}
    <Card className="detail-body"><h2>补记已有素材</h2><form className="search-row" onSubmit={search}>
      <label htmlFor="post-class-search">搜索素材标题</label><input id="post-class-search" value={query} onChange={event => setQuery(event.target.value)} /><Button type="submit">搜索</Button>
    </form><ul className="planned-list">{results.map(material => <li key={material.id} className="planned-item"><span className="planned-material"><span>{material.title}</span><Badge {...materialStatusBadge(material.status)}>{material.status}</Badge></span>
      <Button size="sm" disabled={rows.some(row => row.material.id === material.id)} onClick={() => addExisting(material)}>加入本场</Button></li>)}</ul></Card>
    <Card className="detail-body"><h2>现场新内容</h2><form className="search-row" onSubmit={addNew}>
      <label htmlFor="post-class-new">素材标题</label><input id="post-class-new" maxLength={255} value={newTitle} onChange={event => setNewTitle(event.target.value)} /><Button type="submit">加入草稿</Button>
    </form></Card>
    <div className="post-class-save">
      {error && <Callout tone="risk">{error}</Callout>}
      {saved && <Callout tone="info">课后登记已保存</Callout>}
      <div className="post-class-save__bar">
        <span className="record-meta">本场登记：已用 {usedCount} · 未用 {unusedCount}</span>
        <Button onClick={save} disabled={saving || !session}>{saving ? '保存中…' : '保存课后登记'}</Button>
      </div>
    </div>
  </main>
}
