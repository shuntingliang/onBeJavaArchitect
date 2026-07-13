import { createHashRouter, Navigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Organization from '@/pages/Organization';
import Position from '@/pages/Position';
import UserManagement from '@/pages/User';
import OrganizationTemplate from '@/pages/Template/OrganizationTemplate';
import PositionTemplate from '@/pages/Template/PositionTemplate';
import FunctionSetTemplate from '@/pages/Template/FunctionSetTemplate';
import FunctionSetManagement from '@/pages/FunctionSet';
import ResourceManagement from '@/pages/Resource';
import PlatformPermission from '@/pages/Permission/PlatformPermission';
import AppPermission from '@/pages/Permission/AppPermission';
import SecurityPolicy from '@/pages/Security/PolicyPage';
import AuthAudit from '@/pages/Security/AuditPage';
import TokenPage from '@/pages/Security/TokenPage';

const router = createHashRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: '',
        element: <Dashboard />,
      },
      {
        path: 'organization/inner',
        element: <Organization mode="inner" />,
      },
      {
        path: 'organization/outer',
        element: <Organization mode="outer" />,
      },
      {
        path: 'organization/vertical',
        element: <Organization mode="vertical" />,
      },
      {
        path: 'organization/horizontal',
        element: <Organization mode="horizontal" />,
      },
      {
        path: 'organization',
        element: <Navigate to="/organization/inner" replace />,
      },
      {
        path: 'position',
        element: <Position />,
      },
      {
        path: 'user',
        element: <UserManagement />,
      },
      {
        path: 'template/organization',
        element: <OrganizationTemplate />,
      },
      {
        path: 'template/position',
        element: <PositionTemplate />,
      },
      {
        path: 'template/function-set',
        element: <FunctionSetTemplate />,
      },
      {
        path: 'function-set',
        element: <FunctionSetManagement />,
      },
      {
        path: 'resource',
        element: <ResourceManagement />,
      },
      {
        path: 'permission/platform',
        element: <PlatformPermission />,
      },
      {
        path: 'permission/app',
        element: <AppPermission />,
      },
      {
        path: 'security/policy',
        element: <SecurityPolicy />,
      },
      {
        path: 'security/audit',
        element: <AuthAudit />,
      },
      {
        path: 'security/token',
        element: <TokenPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;
