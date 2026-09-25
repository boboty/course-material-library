import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { Button } from '../../../ui/design-system/components/core/Button.jsx'
import { Badge } from '../../../ui/design-system/components/core/Badge.jsx'
import { Card } from '../../../ui/design-system/components/surfaces/Card.jsx'
import { Callout } from '../../../ui/design-system/components/surfaces/Callout.jsx'
import { createMaterial, findExactTitle, getMaterial, importMaterials, listMaterialFamilyCandidates, listMaterialTags, listMaterials, materialStatuses, materialTypes, updateMaterial, type Material, type MaterialFamilyCandidate, type MaterialPage } from '../api/materials'
import { materialStatusBadge } from '../ui/statusBadge'
import { listAllCourses, type Course } from '../api/courses'
import { listAllAudienceTypes, listAllIndustries, type Vocabulary } from '../api/vocabularies'

export function MaterialList() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const status = params.get('status') || ''
  const type = params.get('type') || ''
  const courseId = params.get('course_id') || ''
  const audienceTypeId = params.get('audience_type_id') || ''
  const industryId = params.get('industry_id') || ''
  const tag = params.get('tag') || ''
  const alert = params.get('alert') || ''
  const page = Math.max(1, Number(params.get('page') || '1') || 1)
  const [input, setInput] = useState(q)
  const [result, setResult] = useState<MaterialPage | null>(null)
  const [error, setError] = useState('')
  const [courses, setCourses] = useState<Course[]>([])
  const [audienceTypes, setAudienceTypes] = useState<Vocabulary[]>([])
  const [industries, setIndustries] = useState<Vocabulary[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [filterError, setFilterError] = useState('')
  useEffect(() => {
    let active = true
    Promise.all([listAllCourses(), listAllAudienceTypes(), listAllIndustries(), listMaterialTags()])
      .then(([allCourses, allAudienceTypes, allIndustries, allTags]) => {
        if (active) {
          setCourses(allCourses); setAudienceTypes(allAudienceTypes)
          setIndustries(allIndustries); setTags(allTags)
        }
      })
      .catch(() => { if (active) setFilterError('筛选项加载失败，请刷新页面重试') })
    return () => { active = false }
  }, [])
  useEffect(() => {
    let active = true
    setResult(null)
    setError('')
    listMaterials(q, page, status, type, undefined, courseId,
      audienceTypeId, industryId, tag, alert).then(data => { if (active) { setResult(data); setError('') } })
      .catch(() => { if (active) setError('素材列表加载失败') })
    return () => { active = false }
  }, [q, page, status, type, courseId, audienceTypeId, industryId, tag, alert])
  const withAlertParam = (next: Record<string, string>) => {
    if (!next.alert) delete next.alert
    return next
  }
  const firstPageParams = (overrides: Record<string, string>) => setParams(withAlertParam({
    q, course_id: courseId, audience_type_id: audienceTypeId, industry_id: industryId,
    tag, type, status, alert, page: '1', ...overrides,
  }))
  const currentParams = (nextPage: string) => withAlertParam({
    q, course_id: courseId, audience_type_id: audienceTypeId, industry_id: industryId,
    tag, type, status, alert, page: nextPage,
  })
  return <main className="material-page by-container">
    <header className="page-header"><div><div className="by-eyebrow by-eyebrow--tick">课程素材库</div><h1>素材列表</h1><p className="by-lead">随手记录，随时找回。</p></div><div className="detail-actions"><Link className="secondary-link" to="/materials/import">批量导入</Link><Link className="primary-link" to="/materials/new">快速录入</Link></div></header>
    <form className="search-row" onSubmit={event => { event.preventDefault(); firstPageParams({ q: input.trim() }) }}>
      <label htmlFor="material-search">搜索标题、正文或标签</label><input id="material-search" value={input} onChange={event => setInput(event.target.value)} /><Button type="submit">搜索</Button>
    </form>
    <label className="material-status-filter" htmlFor="material-course">课程
      <select id="material-course" value={courseId} onChange={event => firstPageParams({ course_id: event.target.value })}>
        <option value="">全部课程</option>{courses.map(course => <option key={course.id} value={course.id}>{course.name}{course.status === '停用' ? '（停用）' : ''}</option>)}
      </select>
    </label>
    <label className="material-status-filter" htmlFor="material-type">类型
      <select id="material-type" value={type} onChange={event => firstPageParams({ type: event.target.value })}>
        <option value="">全部类型</option>{materialTypes.map(item => <option key={item} value={item}>{item}</option>)}
      </select>
    </label>
    <label className="material-status-filter" htmlFor="material-audience">人群
      <select id="material-audience" value={audienceTypeId} onChange={event => firstPageParams({ audience_type_id: event.target.value })}>
        <option value="">全部人群</option>{audienceTypes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </label>
    <label className="material-status-filter" htmlFor="material-industry">行业
      <select id="material-industry" value={industryId} onChange={event => firstPageParams({ industry_id: event.target.value })}>
        <option value="">全部行业</option>{industries.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </label>
    <label className="material-status-filter" htmlFor="material-tag">标签
      <select id="material-tag" value={tag} onChange={event => firstPageParams({ tag: event.target.value })}>
        <option value="">全部标签</option>{tags.map(item => <option key={item} value={item}>{item}</option>)}
      </select>
    </label>
    <label className="material-status-filter" htmlFor="material-status">状态
      <select id="material-status" value={status} onChange={event => firstPageParams({ status: event.target.value })}>
        <option value="">全部状态</option>{materialStatuses.map(item => <option key={item} value={item}>{item}</option>)}
      </select>
    </label>
    <label className="material-status-filter" htmlFor="material-alert">系统提示
      <select id="material-alert" value={alert} onChange={event => firstPageParams({ alert: event.target.value })}>
        <option value="">全部素材</option>
        <option value="review_overdue">复核已过期</option>
        <option value="consecutive_bad">最近连续两次效果差</option>
        <option value="attention">复核过期或连续两次差</option>
      </select>
    </label>
    {filterError && <Callout tone="risk">{filterError}</Callout>}{error && <Callout tone="risk">{error}</Callout>}
    {!result && !error && <p className="result-count">素材加载中…</p>}
    {result && <><p className="result-count">共 {result.total} 条素材</p><div className="material-grid">
      {result.items.map(material => <Link key={material.id} to={`/materials/${material.id}`} className="material-link"><Card interactive accent><div className="material-card-top"><h2>{material.title}</h2><Badge {...materialStatusBadge(material.status)}>{material.status}</Badge></div><p>{material.type || '未填写类型'}</p>{material.review_overdue && <p className="material-alert">复核已过期（{material.review_date}）</p>}{material.consecutive_bad_usages?.length === 2 && <div className="material-alert"><strong>建议复核</strong>{material.consecutive_bad_usages.map((usage, index) => <p key={`${usage.session_date}-${index}`}>场次 {usage.session_date} · {usage.audience_types.join('、') || '未填写人群'} · {usage.customer_name} · {usage.course_name}</p>)}</div>}{material.body?.trim() ? <p className="material-excerpt">{material.body.trim()}</p> : <p className="material-excerpt material-excerpt--empty">尚未填写正文</p>}</Card></Link>)}
    </div>{result.total === 0 && <p>没有找到素材。</p>}<nav className="pager" aria-label="分页"><Button variant="secondary" disabled={page <= 1} onClick={() => setParams(currentParams(String(page - 1)))}>上一页</Button><span>第 {page} 页</span><Button variant="secondary" disabled={page * result.page_size >= result.total} onClick={() => setParams(currentParams(String(page + 1)))}>下一页</Button></nav></>}
  </main>
}

export function DraftMaterials() {
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page') || '1') || 1)
  const [result, setResult] = useState<MaterialPage | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setResult(null)
    setError('')
    listMaterials('', page, '草稿')
      .then(data => { if (active) setResult(data) })
      .catch(() => { if (active) setError('草稿列表加载失败') })
    return () => { active = false }
  }, [page])

  const changePage = (nextPage: number) => setParams(nextPage === 1 ? {} : { page: String(nextPage) })

  return <main className="material-page by-container">
    <header className="page-header"><div><div className="by-eyebrow by-eyebrow--tick">素材整理</div><h1>草稿待补全</h1><p className="by-lead">先记下来，再按需要补充素材信息。</p></div><div className="detail-actions"><Link className="primary-link" to="/materials/new">快速录入</Link></div></header>
    {error && <Callout tone="risk">{error}</Callout>}
    {!result && !error && <p className="result-count">草稿加载中…</p>}
    {result && <>
      <p className="result-count">共 {result.total} 条草稿</p>
      {result.items.length > 0 ? <div className="material-grid draft-grid">
        {result.items.map(material => <Card key={material.id} accent className="draft-card">
          <div className="material-card-top"><h2>{material.title}</h2><Badge {...materialStatusBadge(material.status)}>{material.status}</Badge></div>
          <p className="draft-card__type">{material.type || '未填写类型'}</p>
          <p className={material.body?.trim() ? 'material-excerpt' : 'material-excerpt material-excerpt--empty'}>{material.body?.trim() || '尚未填写正文'}</p>
          {(material.supporting_judgment || material.speaking_notes || material.source_note) && <dl className="draft-card__details">
            {material.supporting_judgment && <><dt>支撑判断</dt><dd>{material.supporting_judgment}</dd></>}
            {material.speaking_notes && <><dt>讲法要点</dt><dd>{material.speaking_notes}</dd></>}
            {material.source_note && <><dt>来源备注（仅内部）</dt><dd>{material.source_note}</dd></>}
          </dl>}
          {(material.tags.length > 0 || material.audience_types.length > 0 || material.industries.length > 0 || material.courses.length > 0) && <p className="draft-card__meta">
            {material.tags.length > 0 && <span>标签：{material.tags.join('、')}</span>}
            {material.audience_types.length > 0 && <span>人群：{material.audience_types.map(item => item.name).join('、')}</span>}
            {material.industries.length > 0 && <span>行业：{material.industries.map(item => item.name).join('、')}</span>}
            {material.courses.length > 0 && <span>课程：{material.courses.map(item => item.name).join('、')}</span>}
          </p>}
          <div className="detail-actions"><Link className="secondary-link" to={`/materials/${material.id}/edit`}>直接编辑</Link></div>
        </Card>)}
      </div> : <p className="draft-empty">当前没有待补全的草稿。新素材保存后会出现在这里。</p>}
      <nav className="pager" aria-label="草稿分页"><Button variant="secondary" disabled={page <= 1} onClick={() => changePage(page - 1)}>上一页</Button><span>第 {page} 页</span><Button variant="secondary" disabled={page * result.page_size >= result.total} onClick={() => changePage(page + 1)}>下一页</Button></nav>
    </>}
  </main>
}

type ImportParse = { items: Array<{ title: string; body: string }>; error: string }

function parseMarkdownForImport(markdown: string): ImportParse {
  if (!markdown.trim()) return { items: [], error: '请粘贴 Markdown 内容。' }
  const items: Array<{ title: string; body: string }> = []
  let title: string | null = null
  let bodyLines: string[] = []
  const saveCurrent = (): string => {
    const body = bodyLines.join('\n').trim()
    if (!body) return `素材「${title}」的正文不能为空。`
    items.push({ title: title || '', body })
    return ''
  }
  const lines = markdown.split(/\r?\n/)
  for (const [index, line] of lines.entries()) {
    const lineNumber = index + 1
    if (line.startsWith('## ')) {
      if (title !== null) {
        const error = saveCurrent()
        if (error) return { items: [], error }
      }
      title = line.slice(3).trim()
      if (!title) return { items: [], error: `第 ${lineNumber} 行缺少素材标题。` }
      bodyLines = []
    } else if (line.trimStart().startsWith('#')) {
      return { items: [], error: `第 ${lineNumber} 行格式错误：素材标题必须使用「## 标题」格式。` }
    } else if (title === null) {
      if (line.trim()) return { items: [], error: `第 ${lineNumber} 行位于第一个「## 标题」之前，请检查格式。` }
    } else {
      bodyLines.push(line)
    }
  }
  if (title === null) return { items: [], error: '未找到「## 标题」，请按约定格式整理内容。' }
  const error = saveCurrent()
  return error ? { items: [], error } : { items, error: '' }
}

export function MaterialImport() {
  const [markdown, setMarkdown] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [importedCount, setImportedCount] = useState<number | null>(null)
  const parsed = useMemo(() => parseMarkdownForImport(markdown), [markdown])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const result = await importMaterials(markdown)
      setImportedCount(result.count)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '批量导入失败，请检查内容后重试')
    } finally {
      setSaving(false)
    }
  }

  if (importedCount !== null) return <main className="material-page by-container">
    <div className="by-eyebrow by-eyebrow--tick">批量导入</div><h1>导入完成</h1>
    <p role="status">成功导入 {importedCount} 条草稿素材。</p>
    <Link className="primary-link" to="/materials">返回素材列表</Link>
  </main>

  return <main className="material-page by-container">
    <Link to="/materials">← 返回素材列表</Link><div className="by-eyebrow by-eyebrow--tick">批量导入</div>
    <h1>导入 Markdown 素材</h1><p className="by-lead">每条素材使用「## 标题」开头，标题下方填写正文。导入后均为草稿，类型待补充。</p>
    <Card accent className="form-card"><form onSubmit={submit} className="material-form">
      <label htmlFor="markdown-import">Markdown 内容<textarea id="markdown-import" rows={16} value={markdown} onChange={event => { setMarkdown(event.target.value); setError('') }} placeholder={'## 一个故事\n\n正文内容……\n\n## 一个案例\n\n正文内容……'} /></label>
      {parsed.error ? <Callout tone="risk" role="alert">格式错误：{parsed.error} 请修正后再导入；本次不会导入任何素材。</Callout> : <p className="result-count" role="status">待导入 {parsed.items.length} 条素材</p>}
      {error && <Callout tone="risk" role="alert">{error}</Callout>}
      <Button type="submit" disabled={saving || Boolean(parsed.error) || parsed.items.length === 0}>{saving ? '导入中…' : '确认导入'}</Button>
    </form></Card>
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
      {duplicate && <Callout tone="warning" role="status">已有同标题素材，仍可继续保存。<Link to={`/materials/${duplicate.id}`}>查看已有素材</Link></Callout>}
      <label>类型<select required value={type} onChange={event => setType(event.target.value)}><option value="">请选择类型</option>{materialTypes.map(item => <option key={item}>{item}</option>)}</select></label>
      <label>正文<textarea required rows={8} value={body} onChange={event => setBody(event.target.value)} /></label>
      {error && <Callout tone="risk">{error}</Callout>}<Button type="submit" disabled={saving}>{saving ? '保存中…' : '保存草稿'}</Button></form></Card>
  </main>
}

export function MaterialDetail() {
  const { id = '' } = useParams()
  const [material, setMaterial] = useState<Material | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { getMaterial(id).then(setMaterial).catch(reason => setError(reason instanceof Error ? reason.message : '素材加载失败')) }, [id])
  return <main className="material-page by-container"><Link to="/materials">← 返回素材列表</Link>{error && <Callout tone="risk">{error}</Callout>}{!material && !error && <p className="result-count">素材加载中…</p>}{material && <><div className="by-eyebrow by-eyebrow--tick">素材详情</div><div className="detail-title"><h1>{material.title}</h1><Badge {...materialStatusBadge(material.status)}>{material.status}</Badge></div><p className="by-lead">{material.type || '未填写类型'}</p><div className="detail-actions"><Link className="primary-link" to={`/materials/${material.id}/edit`}>编辑素材</Link></div><Card accent className="detail-body"><h2>正文</h2><p>{material.body || '尚未填写正文'}</p></Card>
    {material.supporting_judgment && <Card accent className="detail-body"><h2>支撑什么判断</h2><p>{material.supporting_judgment}</p></Card>}
    {material.speaking_notes && <Card accent className="detail-body"><h2>讲法要点</h2><p>{material.speaking_notes}</p></Card>}
    {material.source_note && <Card accent className="detail-body"><h2>来源备注（仅内部可见）</h2><p>{material.source_note}</p></Card>}
    {material.review_date && <Card accent className="detail-body"><h2>复核日期</h2><p>{material.review_date}</p></Card>}
    {material.type === '案例' && material.case_category && <Card accent className="detail-body"><h2>案例类别</h2><p>{material.case_category}</p></Card>}
    {material.type === 'Demo' && material.demo_verified_on && <Card accent className="detail-body"><h2>Demo 最后验证可用日期</h2><p>{material.demo_verified_on}</p></Card>}
    {material.status === '退役' && material.retirement_reason && <Card accent className="detail-body"><h2>退役原因</h2><p>{material.retirement_reason}</p></Card>}
    <Card accent className="detail-body"><h2>素材家族</h2>
      <p>源素材：{material.source_material ? <Link to={`/materials/${material.source_material.id}`}>{material.source_material.title}</Link> : '无（当前素材为家族根）'}</p>
      <p>同家族成员：{material.family_members?.length ? material.family_members.map(member => <span key={member.id}><Link to={`/materials/${member.id}`}>{member.title}</Link> </span>) : '暂无其他成员'}</p>
    </Card>
    <Card accent className="detail-body"><h2>关联课程</h2><p>{material.courses.length ? material.courses.map(course => `${course.name}${course.status === '停用' ? '（停用）' : ''}`).join('、') : '暂无关联课程'}</p></Card>
    {material.audience_types.length > 0 && <Card accent className="detail-body"><h2>适用人群</h2><p>{material.audience_types.map(item => item.name).join('、')}</p></Card>}
    {material.industries.length > 0 && <Card accent className="detail-body"><h2>适用行业</h2><p>{material.industries.map(item => item.name).join('、')}</p></Card>}
    <Card accent className="detail-body"><h2>标签</h2><p>{material.tags.length ? material.tags.join('、') : '暂无标签'}</p></Card>
  </>}</main>
}

export function MaterialEdit() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState('')
  const [body, setBody] = useState('')
  const [supportingJudgment, setSupportingJudgment] = useState('')
  const [speakingNotes, setSpeakingNotes] = useState('')
  const [sourceNote, setSourceNote] = useState('')
  const [reviewDate, setReviewDate] = useState('')
  const [demoVerifiedOn, setDemoVerifiedOn] = useState('')
  const [caseCategory, setCaseCategory] = useState<'A 真实案例' | 'B 情境案例' | ''>('')
  const [retirementReason, setRetirementReason] = useState('')
  const [courses, setCourses] = useState<Course[]>([])
  const [courseIds, setCourseIds] = useState<string[]>([])
  const [audienceTypes, setAudienceTypes] = useState<Vocabulary[]>([])
  const [audienceTypeIds, setAudienceTypeIds] = useState<string[]>([])
  const [industries, setIndustries] = useState<Vocabulary[]>([])
  const [industryIds, setIndustryIds] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [materials, setMaterials] = useState<MaterialFamilyCandidate[]>([])
  const [sourceMaterialId, setSourceMaterialId] = useState('')
  const [tagDraft, setTagDraft] = useState('')
  const [status, setStatus] = useState('草稿')
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    let active = true
    Promise.all([getMaterial(id), listAllCourses(), listAllAudienceTypes(), listAllIndustries(), listMaterialFamilyCandidates()]).then(([material, allCourses, allAudienceTypes, allIndustries, allMaterials]) => {
      if (!active) return
      setTitle(material.title); setType(material.type || ''); setBody(material.body || '')
      setSupportingJudgment(material.supporting_judgment || '')
      setSpeakingNotes(material.speaking_notes || '')
      setSourceNote(material.source_note || '')
      setReviewDate(material.review_date || '')
      setDemoVerifiedOn(material.demo_verified_on || '')
      setCaseCategory(material.case_category || '')
      setRetirementReason(material.retirement_reason || '')
      setCourses(allCourses); setCourseIds(material.courses.map(course => course.id))
      setAudienceTypes(allAudienceTypes); setAudienceTypeIds(material.audience_types.map(item => item.id))
      setIndustries(allIndustries); setIndustryIds(material.industries.map(item => item.id))
      setTags(material.tags)
      setSourceMaterialId(material.source_material_id || '')
      setMaterials(allMaterials.filter(candidate => candidate.id !== id))
      setStatus(material.status); setLoaded(true)
    }).catch(reason => {
      if (active) setLoadError(reason instanceof Error ? reason.message : '素材加载失败')
    })
    return () => { active = false }
  }, [id])
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('')
    if (!title.trim()) { setError('标题不能为空'); return }
    if (status !== '草稿' && (!type || !body.trim())) { setError('非草稿素材必须填写类型和正文'); return }
    setSaving(true)
    try { await updateMaterial(id, {
      title, type: type || null, body: body.trim() ? body : null,
      supporting_judgment: supportingJudgment.trim() || null,
      speaking_notes: speakingNotes.trim() || null,
      source_note: sourceNote.trim() || null,
      review_date: reviewDate || null,
      demo_verified_on: demoVerifiedOn || null,
      case_category: caseCategory || null,
      retirement_reason: retirementReason.trim() || null,
      course_ids: courseIds,
      audience_type_ids: audienceTypeIds,
      industry_ids: industryIds,
      tags,
      source_material_id: sourceMaterialId || null,
      status,
    }); navigate(`/materials/${id}`) }
    catch (reason) { setError(reason instanceof Error ? reason.message : '保存失败') }
    finally { setSaving(false) }
  }
  function addTag() {
    const tag = tagDraft.trim()
    if (tag && !tags.includes(tag)) setTags(current => [...current, tag])
    setTagDraft('')
  }
  return <main className="material-page by-container"><Link to={`/materials/${id}`}>← 返回素材详情</Link><div className="by-eyebrow by-eyebrow--tick">编辑素材</div><h1>编辑素材</h1><p className="by-lead">草稿可暂缺类型和正文；其他状态必须填写完整。</p>
    {loadError && <Callout tone="risk">{loadError}</Callout>}{!loaded && !loadError && <p className="result-count">素材加载中…</p>}
    {loaded && <Card accent className="form-card"><form onSubmit={submit} className="material-form" noValidate><label>标题<input required maxLength={255} value={title} onChange={event => setTitle(event.target.value)} /></label>
      <label>类型<select value={type} onChange={event => { const nextType = event.target.value; setType(nextType); if (nextType !== '案例') setCaseCategory(''); if (nextType !== 'Demo') setDemoVerifiedOn('') }}><option value="">未填写类型</option>{materialTypes.map(item => <option key={item}>{item}</option>)}</select></label>
      <label>正文<textarea rows={8} value={body} onChange={event => setBody(event.target.value)} /></label>
      <label>支撑什么判断<textarea rows={4} value={supportingJudgment} onChange={event => setSupportingJudgment(event.target.value)} /></label>
      <label>讲法要点<textarea rows={4} value={speakingNotes} onChange={event => setSpeakingNotes(event.target.value)} /></label>
      <label>来源备注（仅内部可见）<textarea rows={4} value={sourceNote} onChange={event => setSourceNote(event.target.value)} /></label>
      <label>复核日期<input type="date" value={reviewDate} onChange={event => setReviewDate(event.target.value)} /></label>
      {type === '案例' && <label>案例类别<select value={caseCategory} onChange={event => setCaseCategory(event.target.value as typeof caseCategory)}><option value="">未填写</option><option value="A 真实案例">A 真实案例</option><option value="B 情境案例">B 情境案例</option></select></label>}
      {type === 'Demo' && <label>Demo 最后验证可用日期<input type="date" value={demoVerifiedOn} onChange={event => setDemoVerifiedOn(event.target.value)} /></label>}
      <label htmlFor="material-source">源素材</label><select id="material-source" value={sourceMaterialId} onChange={event => setSourceMaterialId(event.target.value)}><option value="">无，作为独立素材 / 家族根</option>{materials.map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.title}{candidate.source_title ? `（归属：${candidate.source_title}）` : ''}</option>)}</select>
      <p>选择已有家族成员时会自动归到该家族根素材；不复制素材内容。</p>
      <fieldset><legend>关联课程</legend><p>可选择多门课程；不选择表示无关联。</p>{courses.map(course => <label key={course.id}><input type="checkbox" checked={courseIds.includes(course.id)} onChange={event => setCourseIds(current => event.target.checked ? [...current, course.id] : current.filter(value => value !== course.id))} />{course.name}{course.status === '停用' ? '（停用）' : ''}</label>)}</fieldset>
      <fieldset><legend>适用人群</legend><p>可多选；不选择表示不限定适用人群。</p>{audienceTypes.map(item => <label key={item.id}><input type="checkbox" checked={audienceTypeIds.includes(item.id)} onChange={event => setAudienceTypeIds(current => event.target.checked ? [...current, item.id] : current.filter(value => value !== item.id))} />{item.name}</label>)}</fieldset>
      <fieldset><legend>适用行业</legend><p>可多选；不选择表示不限定适用行业。</p>{industries.map(item => <label key={item.id}><input type="checkbox" checked={industryIds.includes(item.id)} onChange={event => setIndustryIds(current => event.target.checked ? [...current, item.id] : current.filter(value => value !== item.id))} />{item.name}</label>)}</fieldset>
      <fieldset className="choice-field"><legend>标签</legend><p>自由输入，可添加多个；首尾空白会自动去除。</p><div className="tag-editor"><label htmlFor="material-tag-input">添加标签<input id="material-tag-input" value={tagDraft} onChange={event => setTagDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addTag() } }} /></label><Button type="button" variant="secondary" onClick={addTag}>添加标签</Button></div><ul className="tag-list">{tags.map(tag => <li key={tag}>{tag}<Button type="button" variant="secondary" aria-label={`删除标签 ${tag}`} onClick={() => setTags(current => current.filter(value => value !== tag))}>删除</Button></li>)}</ul></fieldset>
      <label>状态<select value={status} onChange={event => { const nextStatus = event.target.value; setStatus(nextStatus); if (nextStatus !== '退役') setRetirementReason('') }}>{materialStatuses.map(item => <option key={item}>{item}</option>)}</select></label>
      {status === '退役' && <label>退役原因<textarea rows={3} value={retirementReason} onChange={event => setRetirementReason(event.target.value)} /></label>}
      {error && <Callout tone="risk" role="alert">{error}</Callout>}<Button type="submit" disabled={saving}>{saving ? '保存中…' : '保存修改'}</Button></form></Card>}
  </main>
}
