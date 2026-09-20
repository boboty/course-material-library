import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { Badge } from '../../../ui/design-system/components/core/Badge.jsx'
import { Button } from '../../../ui/design-system/components/core/Button.jsx'
import { Card } from '../../../ui/design-system/components/surfaces/Card.jsx'
import { Callout } from '../../../ui/design-system/components/surfaces/Callout.jsx'
import { ApiError, type Page } from '../api/client'
import { courseStatuses, createCourse, getCourse, listCourses, updateCourse, type Course, type CourseInput } from '../api/courses'

const emptyForm: CourseInput = { name: '', alias: '', status: '启用' }

export function CourseList() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const page = Math.max(1, Number(params.get('page') || '1') || 1)
  const [input, setInput] = useState(q)
  const [result, setResult] = useState<Page<Course> | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    listCourses(q, page).then(data => { if (active) { setResult(data); setError('') } })
      .catch(() => { if (active) setError('课程列表加载失败') })
    return () => { active = false }
  }, [q, page])
  return <main className="material-page by-container">
    <header className="page-header"><div><div className="by-eyebrow by-eyebrow--tick">课程素材库</div><h1>课程</h1><p className="by-lead">停用只影响新建场次时的默认可选范围。</p></div><Link className="primary-link" to="/courses/new">新建课程</Link></header>
    <form className="search-row" onSubmit={event => { event.preventDefault(); setParams({ q: input.trim(), page: '1' }) }}>
      <label htmlFor="course-search">搜索课程</label><input id="course-search" value={input} onChange={event => setInput(event.target.value)} /><Button type="submit">搜索</Button>
    </form>
    {error && <Callout tone="risk">{error}</Callout>}
    {result && <><p className="result-count">共 {result.total} 门课程</p><div className="material-grid">
      {result.items.map(course => <Link key={course.id} to={`/courses/${course.id}/edit`} className="material-link"><Card interactive accent>
        <div className="material-card-top"><h2>{course.name}</h2><Badge tone={course.status === '启用' ? 'success' : 'neutral'}>{course.status}</Badge></div>
        <p>{course.alias || '未填写别名'}</p>
      </Card></Link>)}
    </div>{result.total === 0 && <p>还没有课程，先新建一门。</p>}<nav className="pager" aria-label="分页"><Button variant="secondary" disabled={page <= 1} onClick={() => setParams({ q, page: String(page - 1) })}>上一页</Button><span>第 {page} 页</span><Button variant="secondary" disabled={page * result.page_size >= result.total} onClick={() => setParams({ q, page: String(page + 1) })}>下一页</Button></nav></>}
  </main>
}

export function CourseForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const [form, setForm] = useState<CourseInput>(emptyForm)
  const [loading, setLoading] = useState(editing)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)
    getCourse(id).then(course => {
      if (!active) return
      setForm({ name: course.name, alias: course.alias || '', status: course.status })
      setLoading(false)
    }).catch(reason => {
      if (!active) return
      setError(reason instanceof Error ? reason.message : '课程加载失败')
      setLoading(false)
    })
    return () => { active = false }
  }, [id])
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setSaving(true)
    try {
      const saved = id ? await updateCourse(id, form) : await createCourse(form)
      navigate(`/courses/${saved.id}/edit`)
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : '保存失败，请检查课程名称')
    } finally { setSaving(false) }
  }
  return <main className="material-page by-container"><Link to="/courses">← 返回课程列表</Link>
    <div className="by-eyebrow by-eyebrow--tick">{editing ? '编辑课程' : '新建课程'}</div>
    <h1>{editing ? '编辑课程' : '新建课程'}</h1>
    <p className="by-lead">新建课程默认启用；停用不会删除课程或影响历史场次。</p>
    {loading ? <p className="result-count">课程加载中…</p> : <Card accent className="form-card"><form onSubmit={submit} className="material-form">
      <label>课程名称<input required maxLength={255} value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} /></label>
      <label>别名<input maxLength={255} value={form.alias} onChange={event => setForm(current => ({ ...current, alias: event.target.value }))} /></label>
      <label>状态<select value={form.status} onChange={event => setForm(current => ({ ...current, status: event.target.value as CourseInput['status'] }))}>{courseStatuses.map(status => <option key={status}>{status}</option>)}</select></label>
      {error && <Callout tone="risk">{error}</Callout>}
      <Button type="submit" disabled={saving}>{saving ? '保存中…' : '保存课程'}</Button>
    </form></Card>}
  </main>
}
