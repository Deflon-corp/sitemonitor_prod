import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'
import ProtectedRouter from './ProtectedRouter'
import GuestRouter from './GuestRouter'
import HomePage from '../pages/HomePage'
import Welcome from '../components/welcome/Welcome'
import Home from '../components/home/Home'
import UserList from '../components/user/UserList'
import RuleList from '../components/rule/RuleList'
import HistoryList from '../components/history-center/HistoryList'
import { getTenantId } from '../utils/subdomain'

import AddDomain from '../components/domain/AddDomain'
import UpdateDomain from '../components/domain/UpdateDomain'
import AddUser from '../components/user/AddUser'
import UpdateProfile from '../components/user/UpdateProfile'
import PoliciesView from '../components/policies/PoliciesView'
import Policies from '../components/policies/Policies'
import QualityAssurance from '../components/quality-assurance/QualityAssurance'
import Dashboard from '../components/domain/Dashboard'
import DashboardLayout from '../layouts/DashboardLayout'
import PrioritizedContentPage from '../components/prioritized-content/PrioritizedContentTable'
import Seo from '../components/seo/Seo'
import Accessibility from '../components/accessibility/Accessibility'
import RunWebsiteAuditPage from '../components/audit/Audit'
import SEOHealthSlugPage from '../components/audit/seo-health/SEOHealthSlugPage'
import ResponseStatusDetailPage from '../components/audit/response-status/ResponseStatusDetailPage'
import SpellCheckerDetailPage from '../components/audit/spell-checker/SpellCheckerDetailPage'
import HeartbeatView from '../components/heartbeat/HeartbeatView'
import PerformanceView from '../components/performance/PerformanceView'
import InventoryPage from '../components/inventory/Inventory'


const MainRouter = () => {
  const tenantId = getTenantId();

  return (
    <Routes>
      <Route
        path="/"
        element={
          tenantId ? (
            <GuestRouter>
              <LoginPage />
            </GuestRouter>
          ) : (
            <Welcome />
          )
        }
      />
      <Route
        path="/home"
        element={
          <ProtectedRouter>
            <HomePage />
          </ProtectedRouter>
        }
      >
        <Route index element={<Home />} />
        <Route path="users">
          <Route index element={<UserList />} />
          <Route path="add-user" element={<AddUser />} />
          <Route path="edit-user/:id" element={<AddUser isEditMode={true} />} />
          <Route path="update-profile" element={<UpdateProfile />} />
        </Route>
        <Route path="rules" element={<RuleList />} />
        <Route path="history-center" element={<HistoryList />} />
        <Route path="add-domain" element={<AddDomain />} />
        <Route path="update-domain/:dm_id" element={<UpdateDomain />} />
        <Route path="policies" element={<PoliciesView isLanding={true} />} />
      </Route>
      <Route
        path="/domain"
        element={
          <ProtectedRouter>
            <DashboardLayout breadcrumbTitle="Dashboard">
              <Dashboard />
            </DashboardLayout>
          </ProtectedRouter>
        }
      />
      <Route
        path="/domain/prioritized-content"
        element={
          <ProtectedRouter>
            <DashboardLayout breadcrumbTitle="Prioritized Content" breadcrumbParent="Dashboard" breadcrumbParentHref="/domain">
              <PrioritizedContentPage />
            </DashboardLayout>
          </ProtectedRouter>
        }
      />
      <Route
        path="/domain/policies"
        element={
          <ProtectedRouter>
            <DashboardLayout breadcrumbTitle="Policies" breadcrumbParent="Dashboard" breadcrumbParentHref="/domain">
              <Policies />
            </DashboardLayout>
          </ProtectedRouter>
        }
      />
      <Route
        path="/domain/quality-assurance"
        element={
          <ProtectedRouter>
            <DashboardLayout breadcrumbTitle="Quality Assurance" breadcrumbParent="Dashboard" breadcrumbParentHref="/domain">
              <QualityAssurance />
            </DashboardLayout>
          </ProtectedRouter>
        }
      />
      <Route
        path="/domain/seo"
        element={
          <ProtectedRouter>
            <DashboardLayout breadcrumbTitle="SEO" breadcrumbParent="Dashboard" breadcrumbParentHref="/domain">
              <Seo />
            </DashboardLayout>
          </ProtectedRouter>
        }
      />
      <Route
        path="/domain/accessibility"
        element={
          <ProtectedRouter>
            <DashboardLayout breadcrumbTitle="Accessibility" breadcrumbParent="Dashboard" breadcrumbParentHref="/domain">
              <Accessibility />
            </DashboardLayout>
          </ProtectedRouter>
        }
      />
      <Route
        path="/domain/audit"
        element={
          <ProtectedRouter>
            <RunWebsiteAuditPage />
          </ProtectedRouter>
        }
      />
      <Route
        path="/domain/audit/seo-health/:slug"
        element={
          <ProtectedRouter>
            <SEOHealthSlugPage />
          </ProtectedRouter>
        }
      />
      <Route
        path="/domain/audit/response-status/:slug"
        element={
          <ProtectedRouter>
            <ResponseStatusDetailPage />
          </ProtectedRouter>
        }
      />
      <Route
        path="/domain/audit/spell-checker/:slug"
        element={
          <ProtectedRouter>
            <SpellCheckerDetailPage />
          </ProtectedRouter>
        }
      />
      <Route
        path="/domain/heartbeat"
        element={
          <ProtectedRouter>
            <DashboardLayout breadcrumbTitle="Heartbeat" breadcrumbParent="Dashboard" breadcrumbParentHref="/domain">
              <HeartbeatView />
            </DashboardLayout>
          </ProtectedRouter>
        }
      />
      <Route
        path="/domain/performance"
        element={
          <ProtectedRouter>
            <DashboardLayout breadcrumbTitle="Performance" breadcrumbParent="Dashboard" breadcrumbParentHref="/domain">
              <PerformanceView />
            </DashboardLayout>
          </ProtectedRouter>
        }
      />
      <Route
        path="/domain/inventory"
        element={
          <ProtectedRouter>
            <InventoryPage />
          </ProtectedRouter>
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>)
}

export default MainRouter
