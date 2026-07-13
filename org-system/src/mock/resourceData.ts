import type { Resource } from '@/types';

export const resources: Resource[] = [
  {
    id: 'res-001',
    code: 'RES_0001',
    name: '系统管理',
    parentId: null,
    type: 'CATALOG',
    status: 'ACTIVE',
    path: '/system',
    icon: 'SettingOutlined',
    sort: 1,
    children: [
      {
        id: 'res-002',
        code: 'RES_0002',
        name: '组织架构',
        parentId: 'res-001',
        type: 'MENU',
        status: 'ACTIVE',
        path: '/system/org',
        icon: 'ApartmentOutlined',
        sort: 1,
        children: [
          {
            id: 'res-003',
            code: 'RES_0003',
            name: '新增组织',
            parentId: 'res-002',
            type: 'BUTTON',
            status: 'ACTIVE',
            sort: 1,
          },
          {
            id: 'res-004',
            code: 'RES_0004',
            name: '编辑组织',
            parentId: 'res-002',
            type: 'BUTTON',
            status: 'ACTIVE',
            sort: 2,
          },
          {
            id: 'res-005',
            code: 'RES_0005',
            name: '删除组织',
            parentId: 'res-002',
            type: 'BUTTON',
            status: 'ACTIVE',
            sort: 3,
          },
        ],
      },
      {
        id: 'res-006',
        code: 'RES_0006',
        name: '用户管理',
        parentId: 'res-001',
        type: 'MENU',
        status: 'ACTIVE',
        path: '/system/user',
        icon: 'UserOutlined',
        sort: 2,
        children: [
          {
            id: 'res-007',
            code: 'RES_0007',
            name: '新增用户',
            parentId: 'res-006',
            type: 'BUTTON',
            status: 'ACTIVE',
            sort: 1,
          },
          {
            id: 'res-008',
            code: 'RES_0008',
            name: '重置密码',
            parentId: 'res-006',
            type: 'BUTTON',
            status: 'ACTIVE',
            sort: 2,
          },
        ],
      },
      {
        id: 'res-009',
        code: 'RES_0009',
        name: '岗位管理',
        parentId: 'res-001',
        type: 'MENU',
        status: 'ACTIVE',
        path: '/system/position',
        icon: 'TeamOutlined',
        sort: 3,
      },
      {
        id: 'res-010',
        code: 'RES_0010',
        name: '资源管理',
        parentId: 'res-001',
        type: 'MENU',
        status: 'ACTIVE',
        path: '/system/resource',
        icon: 'LockOutlined',
        sort: 4,
      },
    ],
  },
  {
    id: 'res-011',
    code: 'RES_0011',
    name: '项目管理',
    parentId: null,
    type: 'CATALOG',
    status: 'ACTIVE',
    path: '/project',
    icon: 'ProjectOutlined',
    sort: 2,
    children: [
      {
        id: 'res-012',
        code: 'RES_0012',
        name: '我的项目',
        parentId: 'res-011',
        type: 'MENU',
        status: 'ACTIVE',
        path: '/project/my',
        icon: 'FolderOutlined',
        sort: 1,
      },
      {
        id: 'res-013',
        code: 'RES_0013',
        name: '任务管理',
        parentId: 'res-011',
        type: 'MENU',
        status: 'ACTIVE',
        path: '/project/task',
        icon: 'CheckSquareOutlined',
        sort: 2,
      },
      {
        id: 'res-014',
        code: 'RES_0014',
        name: '项目报表',
        parentId: 'res-011',
        type: 'MENU',
        status: 'INACTIVE',
        path: '/project/report',
        icon: 'BarChartOutlined',
        sort: 3,
      },
    ],
  },
  {
    id: 'res-015',
    code: 'RES_0015',
    name: '营销中心',
    parentId: null,
    type: 'CATALOG',
    status: 'ACTIVE',
    path: '/marketing',
    icon: 'ShoppingCartOutlined',
    sort: 3,
    children: [
      {
        id: 'res-016',
        code: 'RES_0016',
        name: '客户管理',
        parentId: 'res-015',
        type: 'MENU',
        status: 'ACTIVE',
        path: '/marketing/customer',
        icon: 'UsergroupAddOutlined',
        sort: 1,
      },
      {
        id: 'res-017',
        code: 'RES_0017',
        name: '销售订单',
        parentId: 'res-015',
        type: 'MENU',
        status: 'ACTIVE',
        path: '/marketing/order',
        icon: 'FileTextOutlined',
        sort: 2,
      },
    ],
  },
];

export const flattenResources = (resourceList: Resource[]): Resource[] => {
  const result: Resource[] = [];
  const traverse = (items: Resource[]) => {
    items.forEach((item) => {
      const { children, ...rest } = item;
      result.push(rest);
      if (children && children.length > 0) {
        traverse(children);
      }
    });
  };
  traverse(resourceList);
  return result;
};

export default resources;
