import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { Button } from '../../../ui/design-system/components/core/Button.jsx'
import { Card } from '../../../ui/design-system/components/surfaces/Card.jsx'
import { Callout } from '../../../ui/design-system/components/surfaces/Callout.jsx'
import { ApiError, type Page } from '../api/client'
import { createCustomer, getCustomer, listCustomers, updateCustomer, type Customer, type CustomerInput } from '../api/customers'
import { listIndustries, type Vocabulary } from '../api/vocabularies'

const emptyForm: CustomerInput = { name: '', short_name: '', industry_id: null, group_name: '', notes: '' }

export function CustomerList() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const page = Math.max(1, Number(params.get('page') || '1') || 1)
  const [input, setInput] = useState(q)
  const [result, setResult] = useState<Page<Customer> | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    listCustomers(q, page).then(data => { if (active) { setResult(data); setError('') } })
      .catch(() => { if (active) setError('客户列表加载失败') })
    return () => { active = false }
  }, [q, page])
  return <main className="material-page by-container">
    <header className="page-header"><div><div className="by-eyebrow by-eyebrow--tick">课程素材库</div><h1>客户</h1><p className="by-lead">客户使用实体引用，标准名称唯一。</p></div><Link className="primary-link" to="/customers/new">新建客户</Link></header>
    <form className="search-row" onSubmit={event => { event.preventDefault(); setParams({ q: input.trim(), page: '1' }) }}>
      <label htmlFor="customer-search">搜索客户</label><input id="customer-search" value={input} onChange={event => setInput(event.target.value)} /><Button type="submit">搜索</Button>
    </form>
    {error && <Callout tone="risk">{error}</Callout>}
    {result && <><p className="result-count">共 {result.total} 个客户</p><div className="material-grid">
      {result.items.map(customer => <Link key={customer.id} to={`/customers/${customer.id}/edit`} className="material-link"><Card interactive accent>
        <div className="material-card-top"><h2>{customer.name}</h2><span className="record-meta">{customer.short_name || '—'}</span></div>
        <p>{customer.industry ? customer.industry.name : '未填写行业'}{customer.group_name ? ` · ${customer.group_name}` : ''}</p>
      </Card></Link>)}
    </div>{result.total === 0 && <p>还没有客户，先新建一个。</p>}<nav className="pager" aria-label="分页"><Button variant="secondary" disabled={page <= 1} onClick={() => setParams({ q, page: String(page - 1) })}>上一页</Button><span>第 {page} 页</span><Button variant="secondary" disabled={page * result.page_size >= result.total} onClick={() => setParams({ q, page: String(page + 1) })}>下一页</Button></nav></>}
  </main>
}

export function CustomerForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const [form, setForm] = useState<CustomerInput>(emptyForm)
  const [industries, setIndustries] = useState<Vocabulary[]>([])
  const [loading, setLoading] = useState(editing)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    let active = true
    listIndustries().then(data => { if (active) setIndustries(data.items) }).catch(() => {})
    if (id) {
      setLoading(true)
      getCustomer(id).then(customer => {
        if (!active) return
        setForm({
          name: customer.name,
          short_name: customer.short_name || '',
          industry_id: customer.industry_id,
          group_name: customer.group_name || '',
          notes: customer.notes || '',
        })
        setLoading(false)
      }).catch(reason => {
        if (!active) return
        setError(reason instanceof Error ? reason.message : '客户加载失败')
        setLoading(false)
      })
    }
    return () => { active = false }
  }, [id])
  function update<K extends keyof CustomerInput>(key: K, value: CustomerInput[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setSaving(true)
    try {
      const saved = id ? await updateCustomer(id, form) : await createCustomer(form)
      navigate(`/customers/${saved.id}/edit`)
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : '保存失败，请检查标准名称')
    } finally { setSaving(false) }
  }
  return <main className="material-page by-container"><Link to="/customers">← 返回客户列表</Link>
    <div className="by-eyebrow by-eyebrow--tick">{editing ? '编辑客户' : '新建客户'}</div>
    <h1>{editing ? '编辑客户' : '新建客户'}</h1>
    <p className="by-lead">标准名称唯一；简称、行业、集团和备注可后补。</p>
    {loading ? <p className="result-count">客户加载中…</p> : <Card accent className="form-card"><form onSubmit={submit} className="material-form">
      <label>标准名称<input required maxLength={255} value={form.name} onChange={event => update('name', event.target.value)} /></label>
      <label>常用简称<input maxLength={255} value={form.short_name} onChange={event => update('short_name', event.target.value)} /></label>
      <label>行业<select value={form.industry_id || ''} onChange={event => update('industry_id', event.target.value || null)}><option value="">未指定</option>{industries.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>所属集团<input maxLength={255} value={form.group_name} onChange={event => update('group_name', event.target.value)} /></label>
      <label>备注<textarea rows={4} value={form.notes} onChange={event => update('notes', event.target.value)} /></label>
      {error && <Callout tone="risk">{error}</Callout>}
      <Button type="submit" disabled={saving}>{saving ? '保存中…' : '保存客户'}</Button>
    </form></Card>}
  </main>
}
