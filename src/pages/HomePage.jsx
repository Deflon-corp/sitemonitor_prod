import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'

const HomePage = () => {
  const { pathname } = useLocation();

  // Dynamic breadcrumb title based on path
  const breadcrumbTitle =
    pathname === '/home/users' ? "User List" :
      pathname === '/home/users/add-user' ? "Add User" :
      pathname === '/home/users/update-profile' ? "Edit Profile" :
      pathname === '/home/rules' ? "Rule List" :
        pathname === '/home/history-center' ? "History Center" :
          pathname === '/home/add-domain' ? "Add Domain" : "Home";

  return (
    <DashboardLayout breadcrumbTitle={breadcrumbTitle}>
      <Outlet />
    </DashboardLayout>
  )
}

export default HomePage
