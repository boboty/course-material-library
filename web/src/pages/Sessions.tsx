import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { Badge } from '../../../ui/design-system/components/core/Badge.jsx'
import { Button } from '../../../ui/design-system/components/core/Button.jsx'
import { Card } from '../../../ui/design-system/components/surfaces/Card.jsx'
import { Callout } from '../../../ui/design-system/components/surfaces/Callout.jsx'
import { ApiError, type Page } from '../api/client'
import { getCourse, listEnabledCourses, type Course } from '../api/courses'
import { listAllCustomers, type Customer } from '../api/customers'
import { createSession, getSession, listSessions, sessionDurations, type SessionDuration, type TeachingSession } from '../api/sessions'
import { listUsages, removePlannedMaterial, type Usage } from '../api/usages'
import { listAllAudienceTypes, type Vocabulary } from '../api/vocabularies'

function today(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function SessionList() {
  const [params] = useSearchParams()
  const page = Math.max(1, Number(params.get('page') || '1') || 1)
  const [result, setResult] = useState<Page<TeachingSession> | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    listSessions(page).then(data => { if (active) { setResult(data); setError('') } })
      .catch(() => { if (active) setError('场次列表加载失败') })
    return () => { active = false }
  }, [page])
  return <main className="material-page by-container">
    <header className="page-header"><div><div className="by-eyebrow by-eyebrow--tick">课程素材库</div><h1>授课场次</h1><p className="by-lead">一场次引用一个客户和一门主课程。</p></div><Link className="primary-link" to="/sessions/new">新建场次</Link></header>
    {error && <Callout tone="risk">{error}</Callout>}
    {result && <><p className="result-count">共 {result.total} 场场次</p><div className="material-grid">
      {result.items.map(session => <Link key={session.id} to={`/sessions/${session.id}`} className="material-link"><Card interactive accent>
        <div className="material-card-top"><h2>{session.customer.name}</h2><Badge>{session.duration}</Badge></div>
        <p>{session.course.name}</p>
        <p className="record-meta">{session.session_date} · {session.audience_types.map(item => item.name).join('、') || '未记录人群'}</p>
      </Card></Link>)}
    </div>{result.total === 0 && <p>还没有场次，先创建一场。</p>}<nav className="pager" aria-label="分页"><Link className="secondary-link" to={`/sessions?page=${page - 1}`} aria-disabled={page <= 1}>上一页</Link><span>第 {page} 页</span><Link className="secondary-link" to={`/sessions?page=${page + 1}`} aria-disabled={page * result.page_size >= result.total}>下一页</Link></nav></>}
  </main>
}

export function SessionCreate() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [audienceTypes, setAudienceTypes] = useState<Vocabulary[]>([])
  const [customerId, setCustomerId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [sessionDate, setSessionDate] = useState(today())
  const [audienceTypeIds, setAudienceTypeIds] = useState<string[]>([])
  const [audienceDescription, setAudienceDescription] = useState('')
  const [duration, setDuration] = useState<SessionDuration>('一天')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    listAllCustomers().then(items => { if (active) setCustomers(items) }).catch(() => {})
    listEnabledCourses().then(items => { if (active) setCourses(items) }).catch(() => {})
    listAllAudienceTypes().then(items => { if (active) setAudienceTypes(items) }).catch(() => {})
    return () => { active = false }
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault(); setError('')
    if (!customerId) { setError('请选择客户'); return }
    if (!courseId) { setError('请选择主课程'); return }
    if (audienceTypeIds.length === 0) { setError('请至少选择一个人群类型'); return }
    setSaving(true)
    try {
      const created = await createSession({
        customer_id: customerId,
        course_id: courseId,
        session_date: sessionDate,
        audience_type_ids: audienceTypeIds,
        audience_description: audienceDescription,
        duration,
        notes,
      })
      navigate(`/sessions/${created.id}`)
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : '保存失败，请检查场次信息')
    } finally { setSaving(false) }
  }

  return <main className="material-page by-container"><Link to="/sessions">← 返回场次列表</Link>
    <div className="by-eyebrow by-eyebrow--tick">备课</div>
    <h1>新建场次</h1>
    <p className="by-lead">先确定日期、客户、主课程和人群，再选择计划使用的素材。</p>
    <Card accent className="form-card"><form onSubmit={submit} className="material-form">
      <label>日期<input type="date" required value={sessionDate} onChange={event => setSessionDate(event.target.value)} /></label>
      <label>客户<select required value={customerId} onChange={event => setCustomerId(event.target.value)}><option value="">请选择客户</option>{customers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>主课程<select required value={courseId} onChange={event => setCourseId(event.target.value)}><option value="">请选择课程</option>{courses.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <fieldset className="choice-field"><legend>人群类型（多选，至少一个）</legend>
        {audienceTypes.map(item => <label key={item.id} className="choice-item"><input type="checkbox" checked={audienceTypeIds.includes(item.id)} onChange={event => setAudienceTypeIds(current => event.target.checked ? [...current, item.id] : current.filter(id => id !== item.id))} />{item.name}</label>)}
      </fieldset>
      <label>人群描述<textarea rows={3} value={audienceDescription} onChange={event => setAudienceDescription(event.target.value)} placeholder="本场实际听众构成、岗位和特点" /></label>
      <label>时长<select value={duration} onChange={event => setDuration(event.target.value as SessionDuration)}>{sessionDurations.map(item => <option key={item}>{item}</option>)}</select></label>
      <label>备注<textarea rows={3} value={notes} onChange={event => setNotes(event.target.value)} /></label>
      {error && <Callout tone="risk">{error}</Callout>}
      <Button type="submit" disabled={saving}>{saving ? '保存中…' : '保存场次'}</Button>
    </form></Card>
  </main>
}

export function SessionDetail() {
  const { id = '' } = useParams()
  const [session, setSession] = useState<TeachingSession | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [usages, setUsages] = useState<Usage[]>([])
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    getSession(id).then(async data => {
      if (!active) return
      setSession(data)
      setCourse(await getCourse(data.course.id).catch(() => null))
    }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : '场次加载失败') })
    listUsages(id).then(data => { if (active) setUsages(data) })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : '计划素材加载失败') })
    return () => { active = false }
  }, [id])

  async function remove(usage: Usage) {
    setError('')
    try {
      await removePlannedMaterial(id, usage.id)
      setUsages(current => current.filter(item => item.id !== usage.id))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '撤销计划失败')
    }
  }

  return <main className="material-page by-container"><Link to="/sessions">← 返回场次列表</Link>
    {error && <Callout tone="risk">{error}</Callout>}
    {session && <><div className="by-eyebrow by-eyebrow--tick">场次详情</div>
      <div className="detail-title"><h1>{session.customer.name}</h1><Badge>{session.duration}</Badge></div>
      <p className="by-lead">{session.course.name} · {session.session_date}</p>
      <Card accent className="detail-body"><h2>授课信息</h2>
        <dl className="record-list">
          <dt>日期</dt><dd>{session.session_date}</dd>
          <dt>客户</dt><dd>{session.customer.name}{session.customer.short_name ? `（${session.customer.short_name}）` : ''}</dd>
          <dt>客户集团</dt><dd>{session.customer.group_name || '未填写'}</dd>
          <dt>主课程</dt><dd>{session.course.name}{course ? ` · ${course.status}` : ''}</dd>
          <dt>时长</dt><dd>{session.duration}</dd>
          <dt>人群类型</dt><dd>{session.audience_types.map(item => item.name).join('、') || '未记录'}</dd>
          <dt>人群描述</dt><dd>{session.audience_description || '未填写'}</dd>
          <dt>备注</dt><dd>{session.notes || '未填写'}</dd>
        </dl>
      </Card>
      <Card className="detail-body">
        <Link className="primary-link" to={`/sessions/${id}/post-class`}>课后登记</Link>
        <div className="material-card-top"><h2>计划素材（{usages.length}）</h2><Link className="primary-link" to={`/sessions/${id}/materials`}>选择计划素材</Link></div>
        {usages.length === 0 && <p>还没有计划素材。</p>}
        {usages.length > 0 && <ul className="planned-list">
          {usages.map(usage => <li key={usage.id} className="planned-item">
            <div>
              <Link to={`/materials/${usage.material.id}`}>{usage.material.title}</Link>
              <span className="record-meta"> · {usage.material.type || '未填写类型'} · {usage.material.status} · {usage.status} / {usage.effect}</span>
            </div>
            {usage.status === '计划' && <Button variant="secondary" size="sm" onClick={() => remove(usage)}>撤销计划</Button>}
          </li>)}
        </ul>}
      </Card>
    </>}
  </main>
}
