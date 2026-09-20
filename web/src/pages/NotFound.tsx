import { Link } from 'react-router'

export function NotFound() {
  return <main className="material-page by-container">
    <div className="by-eyebrow by-eyebrow--tick">404</div>
    <h1>页面不存在</h1>
    <p className="by-lead">链接可能已失效，或地址输入有误。</p>
    <p className="not-found__back"><Link to="/materials">← 返回素材列表</Link></p>
  </main>
}
