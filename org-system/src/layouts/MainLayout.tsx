import { useState, useEffect } from 'react';
import { Layout, Menu, Breadcrumb, Dropdown, Avatar, Space, theme } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  ApartmentOutlined,
  TeamOutlined,
  UserOutlined,
  FileTextOutlined,
  SnippetsOutlined,
  SafetyOutlined,
  SafetyCertificateOutlined,
  DatabaseOutlined,
  SettingOutlined,
  AppstoreOutlined,
  LockOutlined,
  AuditOutlined,
  KeyOutlined,
  SolutionOutlined,
  BuildOutlined,
  ProjectOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  UserOutlined as UserIcon,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAppStore } from '@/store';

const { Header, Sider, Content } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

const menuItems: MenuItem[] = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: '仪表盘',
  },
  {
    key: 'organization',
    icon: <ApartmentOutlined />,
    label: '组织管理',
    children: [
      { key: '/organization/inner', icon: <ApartmentOutlined />, label: '内部组织架构' },
      { key: '/organization/outer', icon: <ApartmentOutlined />, label: '外部组织架构' },
      { key: '/position', icon: <TeamOutlined />, label: '岗位管理' },
    ],
  },
  {
    key: 'template',
    icon: <FileTextOutlined />,
    label: '模板管理',
    children: [
      { key: '/template/organization', icon: <FileTextOutlined />, label: '组织架构模版' },
      { key: '/template/position', icon: <SnippetsOutlined />, label: '岗位模板' },
    ],
  },
  {
    key: 'user-security',
    icon: <UserOutlined />,
    label: '用户与安全',
    children: [
      { key: '/user', icon: <UserOutlined />, label: '用户管理' },
      { key: '/security/policy', icon: <SafetyOutlined />, label: '安全策略' },
    ],
  },
  {
    key: 'user-auth',
    icon: <KeyOutlined />,
    label: '用户认证',
    children: [
      { key: '/security/token', icon: <KeyOutlined />, label: '令牌管理' },
      { key: '/security/audit', icon: <AuditOutlined />, label: '认证记录' },
    ],
  },
  {
    key: 'permission',
    icon: <SafetyCertificateOutlined />,
    label: '权限管理',
    children: [
      { key: '/function-set', icon: <SafetyCertificateOutlined />, label: '职能集管理' },
      { key: '/template/function-set', icon: <SolutionOutlined />, label: '职能集模版' },
      { key: '/resource', icon: <DatabaseOutlined />, label: '资源管理' },
      { key: '/permission/platform', icon: <SettingOutlined />, label: '平台权限' },
      { key: '/permission/app', icon: <AppstoreOutlined />, label: '应用权限' },
    ],
  },
];

const breadcrumbMap: Record<string, string[]> = {
  '/': ['仪表盘'],
  '/organization/inner': ['组织管理', '内部组织架构'],
  '/organization/outer': ['组织管理', '外部组织架构'],
  '/position': ['组织管理', '岗位管理'],
  '/user': ['用户与安全', '用户管理'],
  '/security/policy': ['用户与安全', '安全策略'],
  '/security/token': ['用户认证', '令牌管理'],
  '/security/audit': ['用户认证', '认证记录'],
  '/template/organization': ['模板管理', '组织模板'],
  '/template/position': ['模板管理', '岗位模板'],
  '/function-set': ['权限管理', '职能集管理'],
  '/template/function-set': ['权限管理', '职能集模版'],
  '/resource': ['权限管理', '资源管理'],
  '/permission/platform': ['权限管理', '平台权限'],
  '/permission/app': ['权限管理', '应用权限'],
};

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { collapsed, toggleCollapsed, user, logout } = useAppStore();
  const { token } = theme.useToken();

  const [selectedKeys, setSelectedKeys] = useState<string[]>(['/']);
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  useEffect(() => {
    const pathname = location.pathname;
    setSelectedKeys([pathname]);

    const parentKeys: string[] = [];
    if (pathname.startsWith('/organization') || pathname.startsWith('/position')) {
      parentKeys.push('organization');
    } else if (pathname.startsWith('/template/')) {
      parentKeys.push('template');
    } else if (pathname.startsWith('/function-set') || pathname.startsWith('/resource') || pathname.startsWith('/permission/')) {
      parentKeys.push('permission');
    } else if (pathname.startsWith('/user') || pathname.startsWith('/security/policy')) {
      parentKeys.push('user-security');
    } else if (pathname.startsWith('/security/token') || pathname.startsWith('/security/audit')) {
      parentKeys.push('user-auth');
    }
    setOpenKeys(parentKeys);
  }, [location.pathname]);

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserIcon />,
      label: '个人中心',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const breadcrumbItems = breadcrumbMap[location.pathname] || ['仪表盘'];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        style={{
          background: token.colorBgContainer,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 20px',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            overflow: 'hidden',
          }}
        >
          <SafetyOutlined
            style={{
              fontSize: collapsed ? 24 : 28,
              color: '#1890ff',
              marginRight: collapsed ? 0 : 12,
            }}
          />
          {!collapsed && (
            <span style={{ fontSize: 16, fontWeight: 600, whiteSpace: 'nowrap' }}>
              用户组织域管理
            </span>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onOpenChange={setOpenKeys}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 'none', paddingTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 16px',
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Space>
            <span
              style={{ fontSize: 18, cursor: 'pointer', color: token.colorText }}
              onClick={toggleCollapsed}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </span>
            <Breadcrumb style={{ marginLeft: 16 }}>
              {breadcrumbItems.map((item, index) => (
                <Breadcrumb.Item key={index}>
                  {index === breadcrumbItems.length - 1 ? (
                    item
                  ) : (
                    <Link to="#">{item}</Link>
                  )}
                </Breadcrumb.Item>
              ))}
            </Breadcrumb>
          </Space>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.nickname || '管理员'}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: 0,
            background: token.colorBgLayout,
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
