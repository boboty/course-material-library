import { BrowserRouter } from 'react-router'
import { AppRouter } from './router'
import { Providers } from './providers'

export function App() {
  return <Providers><BrowserRouter><AppRouter /></BrowserRouter></Providers>
}
