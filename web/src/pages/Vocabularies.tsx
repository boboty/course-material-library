import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '../../../ui/design-system/components/core/Button.jsx'
import { Card } from '../../../ui/design-system/components/surfaces/Card.jsx'
import { Callout } from '../../../ui/design-system/components/surfaces/Callout.jsx'
import { ApiError } from '../api/client'
import { createAudienceType, createIndustry, listAllAudienceTypes, listAllIndustries } from '../api/vocabularies'

type Kind = 'industry' | 'audience'

const labels: Record<Kind, { title: string; lead: string; field: string; button: string }> = {
  industry: {
    title: '行业',
    lead: '客户行业使用这套词表，后续素材适用行业也会复用。',
    field: '行业名称',
    button: '新增行业',
  },
  audience: {
    title: '人群类型',
    lead: '场次人群类型为多选，必须来自这套词表。',
    field: '人群类型名称',
    button: '新增人群类型',
  },
}

const loaders: Record<Kind, () => Promise<{ id: string; name: string }[]>> = {
  industry: listAllIndustries,
  audience: listAllAudienceTypes,
}

type VocabularyItem = { id: string; name: string }

/** 词表只有新增、没有删除，按 id 合并即可：慢加载不会覆盖刚新增的条目。 */
function mergeById(primary: VocabularyItem[], extra: VocabularyItem[]): VocabularyItem[] {
  const merged = new Map(primary.map(item => [item.id, item]))
  for (const item of extra) if (!merged.has(item.id)) merged.set(item.id, item)
  return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name))
}

function VocabularySection({ kind }: { kind: Kind }) {
  const copy = labels[kind]
  const [items, setItems] = useState<VocabularyItem[]>([])
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const inputId = `vocabulary-${kind}-name`

  useEffect(() => {
    let active = true
    loaders[kind]().then(loaded => { if (active) setItems(current => mergeById(loaded, current)) })
      .catch(() => { if (active) setError('词表加载失败') })
    return () => { active = false }
  }, [kind])

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setSaving(true)
    try {
      const created = kind === 'industry' ? await createIndustry(name) : await createAudienceType(name)
      setItems(current => mergeById(current, [{ id: created.id, name: created.name }]))
      setName('')
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : '保存失败')
    } finally { setSaving(false) }
  }

  return <Card accent className="form-card">
    <h2>{copy.title}</h2>
    <p className="by-lead">{copy.lead}</p>
    <form onSubmit={submit} className="material-form">
      <label htmlFor={inputId}>{copy.field}<input id={inputId} required maxLength={100} value={name} onChange={event => setName(event.target.value)} /></label>
      {error && <Callout tone="risk">{error}</Callout>}
      <Button type="submit" disabled={saving}>{saving ? '保存中…' : copy.button}</Button>
    </form>
    <p className="result-count">共 {items.length} 项</p>
    <ul className="vocabulary-list">{items.map(item => <li key={item.id}>{item.name}</li>)}</ul>
  </Card>
}

export function VocabularyMaintenance() {
  return <main className="material-page by-container">
    <div className="by-eyebrow by-eyebrow--tick">基础词表</div>
    <h1>词表维护</h1>
    <p className="by-lead">V1 只维护客户与场次当前需要的最小词表，不做通用词表框架。</p>
    <div className="vocabulary-grid">
      <VocabularySection kind="industry" />
      <VocabularySection kind="audience" />
    </div>
  </main>
}
