import { useState, useMemo, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Card,
  Tag,
  Modal,
  Form,
  Drawer,
  Dropdown,
  message,
  Tree,
  Descriptions,
  Row,
  Col,
  Tooltip,
  Tabs,
  Empty,
  Switch,
} from 'antd';
import type { ColumnsType, TableRowSelection } from 'antd/es/table/interface';
import type { DataNode } from 'antd/es/tree';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  LockOutlined,
  UnlockOutlined,
  StopOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  MoreOutlined,
  KeyOutlined,
  RedoOutlined,
  LogoutOutlined,
  EyeOutlined,
  RollbackOutlined,
  UserOutlined,
  DownOutlined,
  BuildOutlined,
  TeamOutlined,
  SolutionOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import PageContainer from '@/components/PageContainer';
import { useUserStore } from '@/store/userStore';
import { useOrgStore } from '@/store/orgStore';
import { usePositionStore } from '@/store/positionStore';
import { useFunctionSetStore } from '@/store/functionSetStore';
import { formatDateTime } from '@/utils/dateUtils';
import type { User, UserStatus, OrgNode, Position, FunctionSet } from '@/types';

const { Option } = Select;

interface UserFormValues {
  username: string;
  name: string;
  orgNodeId: string;
  positionIds: string[];
  email?: string;
  phone?: string;
}

const statusOptions = [
  { label: '全部', value: '' },
  { label: '正常', value: 'NORMAL' },
  { label: '锁定', value: 'LOCKED' },
  { label: '禁用', value: 'DISABLED' },
  { label: '注销', value: 'CANCELLED' },
  { label: '已删除', value: 'DELETED' },
];

const statusTagMap: Record<UserStatus, { color: string; text: string }> = {
  NORMAL: { color: 'green', text: '正常' },
  LOCKED: { color: 'orange', text: '锁定' },
  DISABLED: { color: 'red', text: '禁用' },
  CANCELLED: { color: 'default', text: '注销' },
  DELETED: { color: 'default', text: '已删除' },
};

type TreeNodeType = 'company' | 'department' | 'position';

interface TreeNodeData extends DataNode {
  nodeType: TreeNodeType;
  orgNodeId?: string;
  positionId?: string;
}

const POSITION_KEY_PREFIX = 'position-';

export default function UserManagement() {
  const { users,
    addUser,
    updateUser,
    lockUser,
    unlockUser,
    disableUser,
    enableUser,
    cancelUser,
    changePassword,
    getNextCode,
    batchUpdateStatus,
    getUserByUsername,
  } = useUserStore();
  const { nodes, getNodeById, getPath, getDescendants } = useOrgStore();
  const { positions, getPositionsByOrgNode } = usePositionStore();
  const { functionSets, getFunctionSetById } = useFunctionSetStore();

  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('NORMAL,LOCKED,DISABLED');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showDeleted, setShowDeleted] = useState(false);

  const [orgTypeTab, setOrgTypeTab] = useState<'VERTICAL' | 'HORIZONTAL' | 'OUTER'>('VERTICAL');
  const [selectedTreeKey, setSelectedTreeKey] = useState<string | undefined>(undefined);
  const [treeSearchKeyword, setTreeSearchKeyword] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(() => {
    // 默认展开到第四层：公司 -> 组织分组 -> 部门 -> 岗位
    const keys: React.Key[] = [];

    const collectToDepth = (data: TreeNodeData[], depth: number, currentDepth: number) => {
      if (currentDepth > depth) return;
      data.forEach((node) => {
        keys.push(node.key);
        if (node.children) {
          collectToDepth(node.children as TreeNodeData[], depth, currentDepth + 1);
        }
      });
    };

    // 先收集一次公司节点用于展开
    const companies = nodes
      .filter((n) => n.type === 'COMPANY' && n.status !== 'DELETED')
      .map((n) => n.id);
    companies.forEach((id) => keys.push(id));

    // 默认展开公司下的分组节点（纵向/横向）
    companies.forEach((companyId) => {
      keys.push(`${companyId}-VERTICAL`);
      keys.push(`${companyId}-HORIZONTAL`);

      // 展开部门
      const departments = nodes.filter(
        (n) => n.parentId === companyId && n.type === 'DEPARTMENT' && n.status !== 'DELETED'
      );
      departments.forEach((dept) => keys.push(dept.id));

      // 展开项目集
      const programs = nodes.filter(
        (n) => n.parentId === companyId && n.type === 'PROGRAM' && n.status !== 'DELETED'
      );
      programs.forEach((prog) => keys.push(prog.id));
    });

    return keys;
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [form] = Form.useForm<UserFormValues>();

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm] = Form.useForm<{ newPassword: string; confirmPassword: string }>();

  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<User | null>(null);

  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState('');

  const [permissionDrawerOpen, setPermissionDrawerOpen] = useState(false);
  const [permissionUser, setPermissionUser] = useState<User | null>(null);

  const activePositions = useMemo(
    () => positions.filter((p) => p.status === 'ACTIVE'),
    [positions]
  );

  const getPositionById = useCallback(
    (id: string) => positions.find((p) => p.id === id),
    [positions]
  );

  const getOrgName = useCallback(
    (orgId: string) => {
      const node = getNodeById(orgId);
      return node?.name || '-';
    },
    [getNodeById]
  );

  const getOrgPathName = useCallback(
    (orgId: string) => {
      const path = getPath(orgId);
      return path.map((n) => n.name).join(' / ');
    },
    [getPath]
  );

  const getPositionNames = useCallback(
    (positionIds: string[]) => {
      return positionIds
        .map((id) => getPositionById(id)?.name)
        .filter(Boolean)
        .join('、');
    },
    [getPositionById]
  );

  const getPositionTags = useCallback(
    (positionIds: string[]) => {
      return positionIds
        .map((id) => getPositionById(id))
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => (
          <Tag key={p!.id} color="blue" style={{ margin: 2 }}>
            {p!.name}
          </Tag>
        ));
    },
    [getPositionById]
  );

  const getDepartmentIds = useCallback(
    (parentId: string): string[] => {
      const result: string[] = [parentId];
      const children = nodes.filter(
        (n) => n.parentId === parentId && n.type === 'DEPARTMENT' && n.status !== 'DELETED'
      );
      children.forEach((child) => {
        result.push(...getDepartmentIds(child.id));
      });
      return result;
    },
    [nodes]
  );

  const getCompanyAndDescendantIds = useCallback(
    (companyId: string): string[] => {
      const result: string[] = [companyId];
      const children = nodes.filter(
        (n) => n.parentId === companyId && n.status !== 'DELETED'
      );
      children.forEach((child) => {
        result.push(child.id);
        if (child.type === 'DEPARTMENT') {
          result.push(...getDepartmentIds(child.id));
        }
      });
      return result;
    },
    [nodes, getDepartmentIds]
  );

  const filteredUsers = useMemo(() => {
    let result = [...users];

    if (!showDeleted) {
      result = result.filter((u) => u.status !== 'DELETED');
    }

    if (keyword) {
      const kw = keyword.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(kw) ||
          u.username.toLowerCase().includes(kw) ||
          u.code.toLowerCase().includes(kw)
      );
    }

    if (selectedTreeKey) {
      if (selectedTreeKey.startsWith(POSITION_KEY_PREFIX)) {
        const positionId = selectedTreeKey.replace(POSITION_KEY_PREFIX, '');
        result = result.filter((u) => u.positionIds.includes(positionId));
      } else {
        const orgNode = getNodeById(selectedTreeKey);
        if (orgNode) {
          let orgIds: string[] = [];
          if (orgNode.type === 'COMPANY') {
            orgIds = getCompanyAndDescendantIds(orgNode.id);
          } else if (orgNode.type === 'DEPARTMENT') {
            orgIds = getDepartmentIds(orgNode.id);
          } else {
            orgIds = [orgNode.id];
          }
          result = result.filter((u) => orgIds.includes(u.orgNodeId));
        }
      }
    }

    const statusList = statusFilter.split(',').filter(Boolean);
    if (statusList.length > 0) {
      result = result.filter((u) => statusList.includes(u.status));
    }

    return result;
  }, [
    users,
    keyword,
    selectedTreeKey,
    statusFilter,
    showDeleted,
    getNodeById,
    getCompanyAndDescendantIds,
    getDepartmentIds,
  ]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const buildOrgTree = useCallback(
    (parentId: string | null, allowedTypes: OrgNode['type'][]): OrgNode[] => {
      return nodes
        .filter(
          (n) =>
            n.parentId === parentId &&
            allowedTypes.includes(n.type) &&
            n.status !== 'DELETED'
        )
        .sort((a, b) => a.sort - b.sort);
    },
    [nodes]
  );

  const buildTreeData = useCallback(
    (orgType: 'VERTICAL' | 'HORIZONTAL' | 'OUTER'): TreeNodeData[] => {
      const buildDepartmentNodes = (parentId: string): TreeNodeData[] => {
        const departments = buildOrgTree(parentId, ['DEPARTMENT']).filter(
          (dept) => orgType === 'OUTER' ? dept.innerOuter === 'OUTER' : dept.orgType === orgType && dept.innerOuter !== 'OUTER'
        );
        return departments.map((dept) => {
          const deptPositions = activePositions.filter((p) => p.orgNodeId === dept.id);
          const positionNodes: TreeNodeData[] = deptPositions.map((pos) => ({
            title: (
              <Space>
                <SolutionOutlined style={{ color: '#faad14' }} />
                <span>{pos.name}</span>
              </Space>
            ),
            key: `${POSITION_KEY_PREFIX}${pos.id}`,
            nodeType: 'position',
            orgNodeId: pos.orgNodeId,
            positionId: pos.id,
            isLeaf: true,
          }));

          return {
            title: (
              <Space>
                <TeamOutlined style={{ color: '#722ed1' }} />
                <span>{dept.name}</span>
              </Space>
            ),
            key: dept.id,
            nodeType: 'department',
            orgNodeId: dept.id,
            children: [...buildDepartmentNodes(dept.id), ...positionNodes],
          };
        });
      };

      const buildProgramNodes = (parentId: string): TreeNodeData[] => {
        const programs = buildOrgTree(parentId, ['PROGRAM']).filter(
          (prog) => orgType === 'OUTER' ? prog.innerOuter === 'OUTER' : prog.orgType === orgType && prog.innerOuter !== 'OUTER'
        );
        return programs.map((prog) => {
          const progPositions = activePositions.filter((p) => p.orgNodeId === prog.id);
          const positionNodes: TreeNodeData[] = progPositions.map((pos) => ({
            title: (
              <Space>
                <SolutionOutlined style={{ color: '#faad14' }} />
                <span>{pos.name}</span>
              </Space>
            ),
            key: `${POSITION_KEY_PREFIX}${pos.id}`,
            nodeType: 'position',
            orgNodeId: pos.orgNodeId,
            positionId: pos.id,
            isLeaf: true,
          }));

          const projects = buildOrgTree(prog.id, ['PROJECT']).filter(
            (proj) => orgType === 'OUTER' ? proj.innerOuter === 'OUTER' : proj.orgType === orgType && proj.innerOuter !== 'OUTER'
          );
          const projectNodes: TreeNodeData[] = projects.map((proj) => {
            const projPositions = activePositions.filter((p) => p.orgNodeId === proj.id);
            const projPositionNodes: TreeNodeData[] = projPositions.map((pos) => ({
              title: (
                <Space>
                  <SolutionOutlined style={{ color: '#faad14' }} />
                  <span>{pos.name}</span>
                </Space>
              ),
              key: `${POSITION_KEY_PREFIX}${pos.id}`,
              nodeType: 'position',
              orgNodeId: pos.orgNodeId,
              positionId: pos.id,
              isLeaf: true,
            }));

            return {
              title: (
                <Space>
                  <SolutionOutlined style={{ color: '#eb2f96' }} />
                  <span>{proj.name}</span>
                </Space>
              ),
              key: proj.id,
              nodeType: 'department',
              orgNodeId: proj.id,
              children: projPositionNodes,
            };
          });

          return {
            title: (
              <Space>
                <FolderOpenOutlined style={{ color: '#fa8c16' }} />
                <span>{prog.name}</span>
              </Space>
            ),
            key: prog.id,
            nodeType: 'department',
            orgNodeId: prog.id,
            children: [...projectNodes, ...positionNodes],
          };
        });
      };

      const rootGroups = nodes.filter(
        (n) => n.parentId === null && n.status !== 'DELETED' &&
          (orgType === 'OUTER' ? n.innerOuter === 'OUTER' : n.innerOuter !== 'OUTER')
      );
      let companies: OrgNode[] = [];
      if (rootGroups.length > 0) {
        rootGroups.forEach((group) => {
          const groupCompanies = buildOrgTree(group.id, ['COMPANY']).filter(
            (c) => orgType === 'OUTER' ? c.innerOuter === 'OUTER' : c.innerOuter !== 'OUTER'
          );
          companies = [...companies, ...groupCompanies];
        });
      } else {
        companies = buildOrgTree(null, ['COMPANY']).filter(
          (c) => orgType === 'OUTER' ? c.innerOuter === 'OUTER' : c.innerOuter !== 'OUTER'
        );
      }

      return companies.map((company) => {
        const deptNodes = buildDepartmentNodes(company.id);
        const progNodes = buildProgramNodes(company.id);
        const children = [...deptNodes, ...progNodes];

        return {
          title: (
            <Space>
              <BuildOutlined style={{ color: '#52c41a' }} />
              <span>{company.name}</span>
            </Space>
          ),
          key: company.id,
          nodeType: 'company',
          orgNodeId: company.id,
          children: children.length > 0 ? children : undefined,
        };
      });
    },
    [activePositions, buildOrgTree, nodes]
  );

  const treeData = useMemo(() => buildTreeData(orgTypeTab), [buildTreeData, orgTypeTab]);

  const filterTreeData = useCallback(
    (data: TreeNodeData[], keyword: string): TreeNodeData[] => {
      if (!keyword) return data;
      const kw = keyword.toLowerCase();
      return data
        .map((node) => {
          const titleText =
            typeof node.title === 'string'
              ? node.title
              : (node.title as React.ReactElement)?.props?.children?.[1]?.props?.children || '';
          const matchSelf = titleText.toLowerCase().includes(kw);
          const filteredChildren = node.children
            ? filterTreeData(node.children as TreeNodeData[], keyword)
            : [];
          if (matchSelf || filteredChildren.length > 0) {
            return { ...node, children: filteredChildren.length > 0 ? filteredChildren : node.children };
          }
          return null;
        })
        .filter(Boolean) as TreeNodeData[];
    },
    []
  );

  const displayTreeData = useMemo(
    () => filterTreeData(treeData, treeSearchKeyword),
    [treeData, treeSearchKeyword, filterTreeData]
  );

  const openAddUserModal = useCallback(
    (orgNodeId?: string, positionId?: string) => {
      setModalType('add');
      setCurrentUser(null);
      form.resetFields();
      form.setFieldsValue({
        orgNodeId,
        positionIds: positionId ? [positionId] : [],
      });
      setModalOpen(true);
    },
    [form]
  );

  const handleTreeSelect = useCallback(
    (_selectedKeys: React.Key[], info: { node: TreeNodeData; selected: boolean }) => {
      const node = info.node;
      const key = node.key as string;
      if (info.selected) {
        setSelectedTreeKey(key);
        if (node.nodeType === 'position' && node.positionId) {
          openAddUserModal(node.orgNodeId, node.positionId);
        }
      } else {
        setSelectedTreeKey(undefined);
      }
      setCurrentPage(1);
    },
    [openAddUserModal]
  );

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleReset = () => {
    setKeyword('');
    setStatusFilter('NORMAL,LOCKED,DISABLED');
    setSelectedTreeKey(undefined);
    setCurrentPage(1);
  };

  const handleAdd = () => {
    openAddUserModal();
  };

  const handleEdit = (user: User) => {
    setModalType('edit');
    setCurrentUser(user);
    form.setFieldsValue({
      username: user.username,
      name: user.name,
      orgNodeId: user.orgNodeId,
      positionIds: user.positionIds,
      email: user.email,
      phone: user.phone,
    });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (modalType === 'add') {
        const existing = getUserByUsername(values.username);
        if (existing) {
          message.error('用户名已存在');
          return;
        }
        addUser({
          username: values.username,
          name: values.name,
          orgNodeId: values.orgNodeId,
          positionIds: values.positionIds,
          email: values.email,
          phone: values.phone,
          status: 'NORMAL',
        });
        message.success('用户创建成功');
      } else if (modalType === 'edit' && currentUser) {
        updateUser(currentUser.id, {
          name: values.name,
          orgNodeId: values.orgNodeId,
          positionIds: values.positionIds,
          email: values.email,
          phone: values.phone,
        });
        message.success('用户信息更新成功');
      }

      setModalOpen(false);
    } catch {
      // 表单验证失败
    }
  };

  const handleLock = (user: User) => {
    Modal.confirm({
      title: '确认锁定',
      content: `确定要锁定用户 "${user.name}" 吗？锁定后用户将无法登录。`,
      okText: '确认锁定',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        lockUser(user.id, '管理员手动锁定');
        message.success('用户已锁定');
      },
    });
  };

  const handleUnlock = (user: User) => {
    Modal.confirm({
      title: '确认解锁',
      content: `确定要解锁用户 "${user.name}" 吗？`,
      okText: '确认解锁',
      cancelText: '取消',
      onOk: () => {
        unlockUser(user.id);
        message.success('用户已解锁');
      },
    });
  };

  const handleDisable = (user: User) => {
    Modal.confirm({
      title: '确认禁用',
      content: `确定要禁用用户 "${user.name}" 吗？禁用后用户将无法登录。`,
      okText: '确认禁用',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        disableUser(user.id);
        message.success('用户已禁用');
      },
    });
  };

  const handleEnable = (user: User) => {
    Modal.confirm({
      title: '确认启用',
      content: `确定要启用用户 "${user.name}" 吗？`,
      okText: '确认启用',
      cancelText: '取消',
      onOk: () => {
        enableUser(user.id);
        message.success('用户已启用');
      },
    });
  };

  const handleCancel = (user: User) => {
    Modal.confirm({
      title: '确认注销',
      content: `确定要注销用户 "${user.name}" 吗？注销后用户将从默认列表中隐藏。`,
      okText: '确认注销',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        cancelUser(user.id);
        message.success('用户已注销');
      },
    });
  };

  const handleDelete = (user: User) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除用户 "${user.name}" 吗？删除后可在"已删除"状态中恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        updateUser(user.id, { status: 'DELETED' });
        message.success('用户已删除');
      },
    });
  };

  const handleRestore = (user: User) => {
    Modal.confirm({
      title: '确认恢复',
      content: `确定要恢复用户 "${user.name}" 吗？恢复后用户状态将变为正常。`,
      okText: '确认恢复',
      cancelText: '取消',
      onOk: () => {
        enableUser(user.id);
        message.success('用户已恢复');
      },
    });
  };

  const handleChangePassword = (user: User) => {
    setCurrentUser(user);
    passwordForm.resetFields();
    setPasswordModalOpen(true);
  };

  const handlePasswordOk = async () => {
    try {
      const values = await passwordForm.validateFields();
      if (currentUser) {
        changePassword(currentUser.id, values.newPassword);
        message.success('密码修改成功');
        setPasswordModalOpen(false);
      }
    } catch {
      // 表单验证失败
    }
  };

  const handleResetPassword = (user: User) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setResetPassword(pwd);
    setResetPasswordModalOpen(true);
    changePassword(user.id, pwd);
  };

  const handleViewDetail = (user: User) => {
    setDetailUser(user);
    setDetailDrawerOpen(true);
  };

  const handleViewPermissions = (user: User) => {
    setPermissionUser(user);
    setPermissionDrawerOpen(true);
  };

  const getUserPermissions = useCallback((user: User) => {
    const positionPermissions: {
      position: Position;
      inheritedFunctionSets: FunctionSet[];
      assignedFunctionSets: FunctionSet[];
    }[] = [];

    user.positionIds.forEach((posId) => {
      const position = getPositionById(posId);
      if (!position) return;

      const allFunctionSetIds = position.functionSetIds || [];
      const inherited = allFunctionSetIds
        .map((fsId) => getFunctionSetById(fsId))
        .filter((fs): fs is FunctionSet => fs !== undefined && position.isInherited);
      const assigned = allFunctionSetIds
        .map((fsId) => getFunctionSetById(fsId))
        .filter((fs): fs is FunctionSet => fs !== undefined && !position.isInherited);

      positionPermissions.push({
        position,
        inheritedFunctionSets: inherited,
        assignedFunctionSets: assigned,
      });
    });

    const allFunctionSets = new Set<FunctionSet>();
    positionPermissions.forEach((pp) => {
      pp.inheritedFunctionSets.forEach((fs) => allFunctionSets.add(fs));
      pp.assignedFunctionSets.forEach((fs) => allFunctionSets.add(fs));
    });

    return {
      positionPermissions,
      allFunctionSets: Array.from(allFunctionSets),
    };
  }, [getPositionById, getFunctionSetById]);

  const availablePositions = useMemo(() => {
    const orgNodeId = form.getFieldValue('orgNodeId');
    if (!orgNodeId) return [];
    return getPositionsByOrgNode(orgNodeId).filter((p) => p.status === 'ACTIVE');
  }, [form, getPositionsByOrgNode]);

  const columns: ColumnsType<User> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
    },
    {
      title: '所属组织',
      dataIndex: 'orgNodeId',
      key: 'orgNodeId',
      width: 220,
      render: (orgId: string) => getOrgPathName(orgId),
    },
    {
      title: '岗位',
      dataIndex: 'positionIds',
      key: 'positionIds',
      width: 200,
      render: (positionIds: string[]) => (
        <div>
          {getPositionTags(positionIds)}
          {positionIds.length > 2 && (
            <Tooltip title={getPositionNames(positionIds)}>
              <Tag style={{ margin: 2 }}>+{positionIds.length - 2}</Tag>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: UserStatus) => (
        <Tag color={statusTagMap[status].color}>{statusTagMap[status].text}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => {
        const isDeleted = record.status === 'DELETED';
        const isCancelled = record.status === 'CANCELLED';

        if (isDeleted) {
          return (
            <Space size="small">
              <Button type="link" size="small" icon={<RollbackOutlined />} onClick={() => handleRestore(record)}>
                恢复
              </Button>
            </Space>
          );
        }

        return (
          <Space size="small">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
              查看
            </Button>
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              编辑
            </Button>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'changePassword',
                    icon: <KeyOutlined />,
                    label: '修改密码',
                    onClick: () => handleChangePassword(record),
                  },
                  {
                    key: 'viewPermissions',
                    icon: <SolutionOutlined />,
                    label: '查看权限',
                    onClick: () => handleViewPermissions(record),
                  },
                  { type: 'divider' as const },
                  {
                    key: 'lock',
                    icon: record.status === 'LOCKED' ? <UnlockOutlined /> : <LockOutlined />,
                    label: record.status === 'LOCKED' ? '解锁' : '锁定',
                    onClick: () =>
                      record.status === 'LOCKED' ? handleUnlock(record) : handleLock(record),
                  },
                  {
                    key: 'resetPassword',
                    icon: <RedoOutlined />,
                    label: '重置密码',
                    onClick: () => handleResetPassword(record),
                  },
                  { type: 'divider' as const },
                  {
                    key: 'enable',
                    icon: <PlayCircleOutlined />,
                    label: record.status === 'DISABLED' ? '启用' : '禁用',
                    onClick: () =>
                      record.status === 'DISABLED' ? handleEnable(record) : handleDisable(record),
                    disabled: isCancelled,
                  },
                  {
                    key: 'cancel',
                    icon: <LogoutOutlined />,
                    label: '注销',
                    onClick: () => handleCancel(record),
                    disabled: record.status === 'DISABLED' || isCancelled,
                  },
                  { type: 'divider' as const },
                  {
                    key: 'delete',
                    icon: <DeleteOutlined />,
                    label: '删除',
                    danger: true,
                    onClick: () => handleDelete(record),
                  },
                ],
              }}
            >
              <Button type="link" size="small" icon={<MoreOutlined />}>
                更多
              </Button>
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  const validatePasswordStrength = (_: unknown, value: string) => {
    if (!value) return Promise.resolve();
    if (value.length < 8) {
      return Promise.reject(new Error('密码长度至少8位'));
    }
    if (!/[A-Z]/.test(value)) {
      return Promise.reject(new Error('密码需包含大写字母'));
    }
    if (!/[a-z]/.test(value)) {
      return Promise.reject(new Error('密码需包含小写字母'));
    }
    if (!/[0-9]/.test(value)) {
      return Promise.reject(new Error('密码需包含数字'));
    }
    return Promise.resolve();
  };

  return (
    <PageContainer title="用户管理" subTitle="按组织架构管理用户，点击岗位即可新增用户">
      <Row gutter={16}>
        <Col xs={24} lg={6} xl={5}>
          <Card
            bodyStyle={{ padding: '12px 0 0 0' }}
            style={{ borderRadius: 8 }}
          >
            <Tabs
              activeKey={orgTypeTab}
              onChange={(key) => {
                setOrgTypeTab(key as 'VERTICAL' | 'HORIZONTAL' | 'OUTER');
                setSelectedTreeKey(undefined);
                setExpandedKeys([]);
                setCurrentPage(1);
              }}
              size="small"
              style={{ padding: '0 12px' }}
              items={[
                { key: 'VERTICAL', label: '职能型' },
                { key: 'HORIZONTAL', label: '项目型' },
                { key: 'OUTER', label: '外部组织' },
              ]}
            />
            <div style={{ padding: '0 12px 12px 12px' }}>
              <Input
                placeholder="搜索公司/部门/岗位"
                prefix={<SearchOutlined />}
                value={treeSearchKeyword}
                onChange={(e) => setTreeSearchKeyword(e.target.value)}
                allowClear
                style={{ marginBottom: 12 }}
              />
              <Tree
                treeData={displayTreeData as DataNode[]}
                selectedKeys={selectedTreeKey ? [selectedTreeKey] : []}
                expandedKeys={expandedKeys}
                onExpand={(keys) => setExpandedKeys(keys)}
                onSelect={handleTreeSelect as any}
                showLine={{ showLeafIcon: false }}
                defaultExpandAll={false}
                style={{ maxHeight: 'calc(100vh - 320px)', overflow: 'auto' }}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={18} xl={19}>
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]} align="bottom">
              <Col xs={24} sm={12} md={8} lg={6}>
                <div style={{ marginBottom: 8, color: '#666' }}>用户名称/编码</div>
                <Input
                  placeholder="请输入用户名称/编码"
                  prefix={<UserOutlined />}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div style={{ marginBottom: 8, color: '#666' }}>状态</div>
                <Select
                  placeholder="请选择状态"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: '100%' }}
                >
                  <Option value="NORMAL,LOCKED,DISABLED">正常/锁定/禁用</Option>
                  <Option value="NORMAL">正常</Option>
                  <Option value="LOCKED">锁定</Option>
                  <Option value="DISABLED">禁用</Option>
                  <Option value="CANCELLED">注销</Option>
                  <Option value="DELETED">已删除</Option>
                  <Option value="NORMAL,LOCKED,DISABLED,CANCELLED,DELETED">全部</Option>
                </Select>
              </Col>
              <Col xs={24} sm={24} md={8} lg={12} style={{ textAlign: 'right' }}>
                <Space>
                  <span style={{ color: '#666' }}>展示已删除记录</span>
                  <Switch checked={showDeleted} onChange={(checked) => { setShowDeleted(checked); setCurrentPage(1); }} />
                  <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                    查询
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={handleReset}>
                    重置
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          <Card>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
              <Space>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                  新增用户
                </Button>
              </Space>
              {selectedTreeKey && (
                <Tag color="blue">
                  {selectedTreeKey.startsWith(POSITION_KEY_PREFIX)
                    ? `岗位：${getPositionById(selectedTreeKey.replace(POSITION_KEY_PREFIX, ''))?.name}`
                    : `组织：${getOrgName(selectedTreeKey)}`}
                </Tag>
              )}
            </div>

            <Table<User>
              rowKey="id"
              columns={columns}
              dataSource={paginatedUsers}
              scroll={{ x: 1000 }}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: filteredUsers.length,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
                onChange: (page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                },
              }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={modalType === 'add' ? '新增用户' : '编辑用户'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        okText="确定"
        cancelText="取消"
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="用户编码" name="code">
                <Input
                  value={modalType === 'add' ? getNextCode() : currentUser?.code}
                  disabled
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="用户名"
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, max: 20, message: '用户名长度为3-20个字符' },
                  { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' },
                ]}
              >
                <Input placeholder="请输入用户名" disabled={modalType === 'edit'} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="姓名"
                name="name"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="所属组织"
                name="orgNodeId"
                rules={[{ required: true, message: '请选择所属组织' }]}
              >
                <Select
                  placeholder="请选择所属组织"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  onChange={() => form.setFieldsValue({ positionIds: [] })}
                >
                  {nodes
                    .filter((n) => n.status !== 'DELETED')
                    .map((node) => (
                      <Option key={node.id} value={node.id}>
                        {getOrgPathName(node.id)}
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="岗位"
            name="positionIds"
            rules={[{ required: true, message: '请选择岗位' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择岗位（从所属组织下选择）"
              disabled={!form.getFieldValue('orgNodeId')}
              allowClear
            >
              {availablePositions.map((pos) => (
                <Option key={pos.id} value={pos.id}>
                  {pos.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="邮箱"
                name="email"
                rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="手机号"
                name="phone"
                rules={[
                  {
                    pattern: /^1[3-9]\d{9}$/,
                    message: '请输入有效的手机号',
                  },
                ]}
              >
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="修改密码"
        open={passwordModalOpen}
        onOk={handlePasswordOk}
        onCancel={() => setPasswordModalOpen(false)}
        okText="确定"
        cancelText="取消"
        width={480}
        destroyOnClose
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { validator: validatePasswordStrength },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            label="确认密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
          <div style={{ color: '#999', fontSize: 12, lineHeight: 1.8 }}>
            <div>密码要求：</div>
            <div>• 长度至少8位</div>
            <div>• 包含大写字母、小写字母、数字</div>
          </div>
        </Form>
      </Modal>

      <Modal
        title="重置密码成功"
        open={resetPasswordModalOpen}
        onOk={() => setResetPasswordModalOpen(false)}
        onCancel={() => setResetPasswordModalOpen(false)}
        okText="知道了"
        cancelButtonProps={{ style: { display: 'none' } }}
        width={480}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ marginBottom: 16, color: '#52c41a', fontSize: 48 }}>
            <KeyOutlined />
          </div>
          <div style={{ marginBottom: 16, fontSize: 16, fontWeight: 500 }}>
            密码已重置，请妥善保管
          </div>
          <div
            style={{
              padding: '16px 24px',
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: 4,
              fontFamily: 'monospace',
              fontSize: 18,
              letterSpacing: 2,
              color: '#389e0d',
              userSelect: 'all',
            }}
          >
            {resetPassword}
          </div>
        </div>
      </Modal>

      <Drawer
        title="用户详情"
        placement="right"
        width={520}
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
      >
        {detailUser && (
          <>
            <Descriptions title="基本信息" column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="用户编码">{detailUser.code}</Descriptions.Item>
              <Descriptions.Item label="用户名">{detailUser.username}</Descriptions.Item>
              <Descriptions.Item label="姓名">{detailUser.name}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{detailUser.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="手机">{detailUser.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusTagMap[detailUser.status].color}>
                  {statusTagMap[detailUser.status].text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="所属组织">
                {getOrgPathName(detailUser.orgNodeId)}
              </Descriptions.Item>
              <Descriptions.Item label="岗位">
                {getPositionNames(detailUser.positionIds) || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="时间信息" column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="创建时间">
                {formatDateTime(detailUser.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {formatDateTime(detailUser.updatedAt)}
              </Descriptions.Item>
              <Descriptions.Item label="最后登录时间">-</Descriptions.Item>
            </Descriptions>

            {detailUser.status === 'LOCKED' && (
              <Descriptions title="安全信息" column={1} bordered size="small">
                <Descriptions.Item label="锁定原因">
                  {detailUser.lockReason || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="锁定时间">
                  {detailUser.lockTime ? formatDateTime(detailUser.lockTime) : '-'}
                </Descriptions.Item>
              </Descriptions>
            )}
          </>
        )}
      </Drawer>

      <Drawer
        title="用户权限详情"
        placement="right"
        width={700}
        open={permissionDrawerOpen}
        onClose={() => setPermissionDrawerOpen(false)}
        extra={
          permissionUser ? (
            <Space>
              <Tag color="blue">{permissionUser.name}</Tag>
              <Tag>{permissionUser.positionIds.length} 个岗位</Tag>
            </Space>
          ) : null
        }
      >
        {permissionUser && (
          <div style={{ padding: 16 }}>
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}>权限来源图示</h4>
              <div style={{ 
                background: '#fafafa', 
                padding: 20, 
                borderRadius: 8,
                border: '1px solid #f0f0f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      width: 80, 
                      height: 80, 
                      background: '#1890ff', 
                      borderRadius: 8, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginBottom: 8
                    }}>
                      <span style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>用户</span>
                    </div>
                    <span style={{ fontSize: 12, color: '#666' }}>{permissionUser.name}</span>
                  </div>
                  <div style={{ fontSize: 24, color: '#ccc' }}>→</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      width: 80, 
                      height: 80, 
                      background: '#52c41a', 
                      borderRadius: 8, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginBottom: 8
                    }}>
                      <span style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>岗位</span>
                    </div>
                    <span style={{ fontSize: 12, color: '#666' }}>{permissionUser.positionIds.length} 个岗位</span>
                  </div>
                  <div style={{ fontSize: 24, color: '#ccc' }}>→</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      width: 80, 
                      height: 80, 
                      background: '#faad14', 
                      borderRadius: 8, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginBottom: 8
                    }}>
                      <span style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>职能集</span>
                    </div>
                    <span style={{ fontSize: 12, color: '#666' }}>N 个职能集</span>
                  </div>
                  <div style={{ fontSize: 24, color: '#ccc' }}>→</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      width: 80, 
                      height: 80, 
                      background: '#722ed1', 
                      borderRadius: 8, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginBottom: 8
                    }}>
                      <span style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>资源权限</span>
                    </div>
                    <span style={{ fontSize: 12, color: '#666' }}>菜单/按钮</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h4 style={{ marginBottom: 16, fontSize: 14, fontWeight: 500 }}>岗位权限明细</h4>
              {(() => {
                const { positionPermissions } = getUserPermissions(permissionUser);
                if (positionPermissions.length === 0) {
                  return <Empty description="该用户未分配任何岗位" />;
                }
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {positionPermissions.map((pp) => (
                      <div key={pp.position.id} style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
                        <div style={{ 
                          background: '#fafafa', 
                          padding: '12px 16px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 12 
                        }}>
                          <Tag color="blue">{pp.position.name}</Tag>
                          <Tag color="orange">{pp.position.positionType === 'MANAGEMENT' ? '管理岗' : '普通岗'}</Tag>
                          <Tag color={pp.position.isInherited ? 'green' : 'default'}>
                            {pp.position.isInherited ? '继承权限' : '独立权限'}
                          </Tag>
                          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#999' }}>
                            岗位编码: {pp.position.code}
                          </span>
                        </div>
                        <div style={{ padding: '16px' }}>
                          {pp.inheritedFunctionSets.length > 0 && (
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <Tag color="green" style={{ fontSize: 11 }}>继承权限</Tag>
                                <span style={{ fontSize: 12, color: '#999' }}>(从上级岗位继承)</span>
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {pp.inheritedFunctionSets.map((fs) => (
                                  <div key={fs.id} style={{ 
                                    background: '#f6ffed', 
                                    border: '1px solid #b7eb8f', 
                                    padding: '6px 12px', 
                                    borderRadius: 4,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8
                                  }}>
                                    <span style={{ color: '#389e0d', fontSize: 13 }}>{fs.name}</span>
                                    <span style={{ color: '#999', fontSize: 11 }}>({fs.code})</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {pp.assignedFunctionSets.length > 0 && (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <Tag color="orange" style={{ fontSize: 11 }}>单独配置</Tag>
                                <span style={{ fontSize: 12, color: '#999' }}>(直接分配给该岗位)</span>
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {pp.assignedFunctionSets.map((fs) => (
                                  <div key={fs.id} style={{ 
                        background: '#fff7e6', 
                        border: '1px solid #ffd591', 
                        padding: '6px 12px', 
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}>
                                    <span style={{ color: '#d46b08', fontSize: 13 }}>{fs.name}</span>
                                    <span style={{ color: '#999', fontSize: 11 }}>({fs.code})</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {pp.inheritedFunctionSets.length === 0 && pp.assignedFunctionSets.length === 0 && (
                            <div style={{ color: '#999', fontSize: 12 }}>该岗位未配置任何职能集权限</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div>
              <h4 style={{ marginBottom: 16, fontSize: 14, fontWeight: 500 }}>权限汇总</h4>
              {(() => {
                const { allFunctionSets } = getUserPermissions(permissionUser);
                if (allFunctionSets.length === 0) {
                  return <Empty description="该用户无任何权限" />;
                }
                return (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {allFunctionSets.map((fs) => (
                      <div key={fs.id} style={{ 
                        background: '#f0f5ff', 
                        border: '1px solid #d6e4ff', 
                        padding: '10px 16px', 
                        borderRadius: 4,
                        minWidth: 200
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ color: '#1677ff', fontSize: 13, fontWeight: 500 }}>{fs.name}</span>
                        <Tag color={fs.status === 'ACTIVE' ? 'green' : 'default'}>
                          {fs.status === 'ACTIVE' ? '启用' : '停用'}
                        </Tag>
                      </div>
                        <div style={{ fontSize: 12, color: '#999' }}>{fs.description || '无描述'}</div>
                        <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                          资源数: {fs.resourceIds.length}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </Drawer>
    </PageContainer>
  );
}
