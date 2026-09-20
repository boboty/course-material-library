import { Navigate, Route, Routes } from 'react-router'
import { AppLayout } from './AppLayout'
import { CourseForm, CourseList } from '../pages/Courses'
import { CustomerForm, CustomerList } from '../pages/Customers'
import { MaterialCreate, MaterialDetail, MaterialList } from '../pages/Materials'
import { SessionCreate, SessionDetail, SessionList } from '../pages/Sessions'
import { SessionMaterials } from '../pages/SessionMaterials'
import { SystemStatus } from '../pages/SystemStatus'
import { VocabularyMaintenance } from '../pages/Vocabularies'

export function AppRouter() {
  return <AppLayout><Routes>
    <Route path="/" element={<Navigate to="/materials" replace />} />
    <Route path="/materials" element={<MaterialList />} />
    <Route path="/materials/new" element={<MaterialCreate />} />
    <Route path="/materials/:id" element={<MaterialDetail />} />
    <Route path="/customers" element={<CustomerList />} />
    <Route path="/customers/new" element={<CustomerForm />} />
    <Route path="/customers/:id/edit" element={<CustomerForm />} />
    <Route path="/courses" element={<CourseList />} />
    <Route path="/courses/new" element={<CourseForm />} />
    <Route path="/courses/:id/edit" element={<CourseForm />} />
    <Route path="/vocabularies" element={<VocabularyMaintenance />} />
    <Route path="/sessions" element={<SessionList />} />
    <Route path="/sessions/new" element={<SessionCreate />} />
    <Route path="/sessions/:id/materials" element={<SessionMaterials />} />
    <Route path="/sessions/:id" element={<SessionDetail />} />
    <Route path="/status" element={<SystemStatus />} />
  </Routes></AppLayout>
}
