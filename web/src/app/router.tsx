import { Navigate, Route, Routes } from 'react-router'
import { MaterialCreate, MaterialDetail, MaterialList } from '../pages/Materials'
import { SystemStatus } from '../pages/SystemStatus'

export function AppRouter() {
  return <Routes>
    <Route path="/" element={<Navigate to="/materials" replace />} />
    <Route path="/materials" element={<MaterialList />} />
    <Route path="/materials/new" element={<MaterialCreate />} />
    <Route path="/materials/:id" element={<MaterialDetail />} />
    <Route path="/status" element={<SystemStatus />} />
  </Routes>
}
