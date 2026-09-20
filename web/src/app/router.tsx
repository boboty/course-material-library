import { Route, Routes } from 'react-router'
import { SystemStatus } from '../pages/SystemStatus'

export function AppRouter() {
  return <Routes><Route path="/" element={<SystemStatus />} /></Routes>
}
