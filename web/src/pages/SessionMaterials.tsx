import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Badge } from '../../../ui/design-system/components/core/Badge.jsx'
import { Button } from '../../../ui/design-system/components/core/Button.jsx'
import { Card } from '../../../ui/design-system/components/surfaces/Card.jsx'
import { Callout } from '../../../ui/design-system/components/surfaces/Callout.jsx'
import { ApiError } from '../api/client'
import { listSessionMaterialCandidates, type SessionMaterialCandidate } from '../api/materials'
import { getSession, type TeachingSession } from '../api/sessions'
import { listUsages, planMaterial, removePlannedMaterial, type Usage } from '../api/usages'
import { effectBadge, materialStatusBadge, usageStatusBadge } from '../ui/statusBadge'

export function SessionMaterials() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState<TeachingSession | null>(null)
  const [usages, setUsages] = useState<Usage[]>([])
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [results, setResults] = useState<SessionMaterialCandidate[]>([])
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getSession(id).then(data => { if (active) setSession(data) })
      .catch(() => { if (active) setError('场次加载失败') })
    listUsages(id).then(data => { if (active) setUsages(data) })
      .catch(() => { if (active) setError('计划素材加载失败') })
    return () => { active = false }
  }, [id])

  useEffect(() => {
    let active = true
    listSessionMaterialCandidates(id, submitted).then(data => {
      if (!active) return
      setResults(data)
      setSearched(true)
    }).catch(() => { if (active) setError('素材搜索失败') })
    return () => { active = false }
  }, [id, submitted])

  const plannedIds = new Set(usages.map(usage => usage.material_id))
  const prioritizedResults = session
    ? results.filter(material => material.courses.some(course => course.id === session.course.id))
      .concat(results.filter(material => !material.courses.some(course => course.id === session.course.id)))
    : results

  function applyUsages(next: Usage[]) {
    setUsages(next)
    setError('')
  }

  async function add(materialId: string) {
    setError('')
    try {
      const created = await planMaterial(id, materialId)
      if (!usages.some(usage => usage.id === created.id)) {
        applyUsages(await listUsages(id).catch(() => [...usages, created]))
      }
    } catch (reason) {
      // 重复点击或并发加入：服务端已存在该计划，刷新真实状态而不是报错
      if (reason instanceof ApiError && reason.code === 'CONFLICT') {
        applyUsages(await listUsages(id).catch(() => usages))
        return
      }
      setError(reason instanceof ApiError ? reason.message : '加入计划失败')
    }
  }

  async function remove(usage: Usage) {
    setError('')
    try {
      await removePlannedMaterial(id, usage.id)
      applyUsages(usages.filter(item => item.id !== usage.id))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '撤销计划失败')
    }
  }

  return <main className="material-page by-container">
    <Link to={`/sessions/${id}`}>← 返回场次详情</Link>
    <div className="by-eyebrow by-eyebrow--tick">备课 · 计划素材</div>
    <h1>选择计划素材</h1>
    <p className="by-lead">{session ? `${session.customer.name} · ${session.course.name} · ${session.session_date}` : '场次信息加载中…'}</p>

    <Card accent className="detail-body">
      <h2>本场计划（{usages.length}）</h2>
      {usages.length === 0 && <p>还没有计划素材。在下方搜索并加入。</p>}
      {usages.length > 0 && <ul className="planned-list">
        {usages.map(usage => <li key={usage.id} className="planned-item">
          <div>
            <Link to={`/materials/${usage.material.id}`}>{usage.material.title}</Link>
            <div className="record-badges">
              <span className="record-meta">{usage.material.type || '未填写类型'}</span>
              <Badge {...materialStatusBadge(usage.material.status)}>{usage.material.status}</Badge>
              <Badge {...usageStatusBadge(usage.status)}>{usage.status}</Badge>
              <Badge {...effectBadge(usage.effect)}>{usage.effect}</Badge>
            </div>
          </div>
          {usage.status === '计划' && <Button variant="secondary" size="sm" onClick={() => remove(usage)}>撤销计划</Button>}
        </li>)}
      </ul>}
    </Card>

    <Card className="detail-body">
      <h2>搜索全库素材</h2>
      <p>优先显示关联本课程的素材；其他素材仍可搜索并加入。</p>
      <form className="search-row" onSubmit={(event: FormEvent) => {
        event.preventDefault()
        setSubmitted(query.trim())
      }}>
        <label htmlFor="plan-material-search">搜索素材标题</label>
        <input id="plan-material-search" value={query} onChange={event => setQuery(event.target.value)} />
        <Button type="submit">搜索</Button>
      </form>
      {error && <Callout tone="risk">{error}</Callout>}
      {searched && results.length === 0 && <p>没有找到素材。</p>}
      <ul className="planned-list">
        {prioritizedResults.map(material => <li key={material.id} className="planned-item">
          <div>
            <Link to={`/materials/${material.id}`}>{material.title}</Link>
            <div className="record-badges">
              <span className="record-meta">{material.type || '未填写类型'}</span>
              <Badge {...materialStatusBadge(material.status)}>{material.status}</Badge>
            </div>
            {material.repeat_usage && <div className={`repeat-usage repeat-usage--${material.repeat_usage.level}`}>
              <Badge tone={material.repeat_usage.level === 'same_customer' ? 'risk' : 'warning'}>
                {material.repeat_usage.level === 'same_customer' ? '同客户已用过' : '同集团其他客户已用过'}
              </Badge>
              <span>最近一次：{material.repeat_usage.session_date} · {material.repeat_usage.course_name} · {material.repeat_usage.audience_types.join('、')} · {material.repeat_usage.customer_name}</span>
            </div>}
          </div>
          {plannedIds.has(material.id)
            ? <Badge tone="success">已加入本场计划</Badge>
            : <Button size="sm" onClick={() => add(material.id)}>加入计划</Button>}
        </li>)}
      </ul>
    </Card>

    <Button variant="secondary" onClick={() => navigate(`/sessions/${id}`)}>完成，返回场次详情</Button>
  </main>
}
