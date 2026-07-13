import { useState, useMemo, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  TreeSelect,
  Drawer,
  Tag,
  message,
  Dropdown,
  Transfer,
  Descriptions,
  List,
  Tooltip,
  Typography,
  Divider,
  Card,
  Tree,
  Row,
  Col,
  Tabs,
  type MenuProps,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  StopOutlined,
  PlayCircleOutlined,
  MoreOutlined,
  EyeOutlined,
  TeamOutlined,
  RollbackOutlined,
  BuildOutlined,
  FolderOpenOutlined,
  SolutionOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { DataNode } from 'antd/es/tree';
import PageContainer from '@/components/PageContainer';
import { usePositionStore } from '@/store/positionStore';
import { useOrgStore } from '@/store/orgStore';
import { useFunctionSetStore } from '@/store/functionSetStore';
import { useUserStore } from '@/store/userStore';
import type { Position, OrgNode, FunctionSet, User } from '@/types';
import { formatDateTime } from '@/utils/dateUtils';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

interface FormValues {
  code?: string;
  name: string;
  orgNodeId: string;
  description?: string;
  positionType?: 'MANAGEMENT' | 'NON_MANAGEMENT';
  positionLevel?: 'P0' | 'P1' | 'P2';
  isInherited?: boolean;
}

interface TreeNodeData extends DataNode {
  nodeType: 'company' | 'department';
  orgNodeId?: string;
}

export default function PositionPage() {
  const { positions, addPosition, updatePosition, deletePosition, activatePosition, deactivatePosition, restorePosition, searchPositions, getNextCode } = usePositionStore();
  const { nodes: orgNodes, getTree, getNodeById, getPath } = useOrgStore();
  const { functionSets, getFunctionSetsByStatus } = useFunctionSetStore();
  const { getUsersByPosition } = useUserStore();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedOrgNodeId, setSelectedOrgNodeId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const [orgTypeTab, setOrgTypeTab] = useState<'VERTICAL' | 'HORIZONTAL'>('VERTICAL');
  const [treeSearchKeyword, setTreeSearchKeyword] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [form] = Form.useForm<FormValues>();

  const [detailVisible, setDetailVisible] = useState(false);
  const [detailPosition, setDetailPosition] = useState<Position | null>(null);

  const [functionSetModalVisible, setFunctionSetModalVisible] = useState(false);
  const [functionSetEditModalVisible, setFunctionSetEditModalVisible] = useState(false);
  const [targetPositionId, setTargetPositionId] = useState<string | null>(null);
  const [targetFunctionSetKeys, setTargetFunctionSetKeys] = useState<string[]>([]);
  const [selectedFunctionSetKeys, setSelectedFunctionSetKeys] = useState<string[]>([]);
  const [functionSetSearchKeyword, setFunctionSetSearchKeyword] = useState('');

  const orgTreeData = useMemo<DataNode[]>(() => {
    const buildTree = (nodes: (OrgNode & { children?: OrgNode[] })[]): DataNode[] => {
      return nodes
        .filter((n) => n.status === 'ACTIVE')
        .map((node) => ({
          title: node.name,
          value: node.id,
          key: node.id,
          children: node.children ? buildTree(node.children) : undefined,
        }));
    };
    return buildTree(getTree() as (OrgNode & { children?: OrgNode[] })[]);
  }, [getTree]);

  const buildOrgTree = useCallback(
    (parentId: string | null, allowedTypes: OrgNode['type'][]): OrgNode[] => {
      return orgNodes
        .filter(
          (n) =>
            n.parentId === parentId &&
            allowedTypes.includes(n.type) &&
            n.status !== 'DELETED'
        )
        .sort((a, b) => a.sort - b.sort);
    },
    [orgNodes]
  );

  const buildTreeData = useCallback(
    (orgType: 'VERTICAL' | 'HORIZONTAL'): TreeNodeData[] => {
      const buildDepartmentNodes = (parentId: string): TreeNodeData[] => {
        const departments = buildOrgTree(parentId, ['DEPARTMENT']).filter(
          (dept) => dept.orgType === orgType
        );
        return departments.map((dept) => {
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
            children: buildDepartmentNodes(dept.id),
          };
        });
      };

      const buildProgramNodes = (parentId: string): TreeNodeData[] => {
        const programs = buildOrgTree(parentId, ['PROGRAM']).filter(
          (prog) => prog.orgType === orgType
        );
        return programs.map((prog) => {
          const projects = buildOrgTree(prog.id, ['PROJECT']).filter(
            (proj) => proj.orgType === orgType
          );
          const projectNodes: TreeNodeData[] = projects.map((proj) => {
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
              children: [],
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
            children: projectNodes,
          };
        });
      };

      const rootGroups = orgNodes.filter(
        (n) => n.parentId === null && n.status !== 'DELETED'
      );
      let companies: OrgNode[] = [];
      if (rootGroups.length > 0) {
        rootGroups.forEach((group) => {
          const groupCompanies = buildOrgTree(group.id, ['COMPANY']);
          companies = [...companies, ...groupCompanies];
        });
      } else {
        companies = buildOrgTree(null, ['COMPANY']);
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
    [orgNodes, buildOrgTree]
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

  const handleTreeSelect = useCallback(
    (_selectedKeys: React.Key[], info: { node: TreeNodeData; selected: boolean }) => {
      const node = info.node;
      if (info.selected && node.orgNodeId) {
        setSelectedOrgNodeId(node.orgNodeId);
      } else {
        setSelectedOrgNodeId(null);
      }
      setPagination({ ...pagination, current: 1 });
    },
    [pagination]
  );

  const filteredPositions = useMemo(() => {
    let result = [...positions];

    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(kw) ||
          p.code.toLowerCase().includes(kw)
      );
    }

    if (selectedOrgNodeId) {
      const getDescendantIds = (parentId: string): string[] => {
        const ids: string[] = [parentId];
        const children = orgNodes.filter((n) => n.parentId === parentId);
        children.forEach((child) => {
          ids.push(...getDescendantIds(child.id));
        });
        return ids;
      };
      const orgIds = getDescendantIds(selectedOrgNodeId);
      result = result.filter((p) => orgIds.includes(p.orgNodeId));
    }

    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }

    return result;
  }, [positions, searchKeyword, selectedOrgNodeId, statusFilter, orgNodes]);

  const paginatedPositions = useMemo(() => {
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredPositions.slice(start, end);
  }, [filteredPositions, pagination]);

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Tag color="green">启用</Tag>;
      case 'INACTIVE':
        return <Tag color="default">停用</Tag>;
      case 'DELETED':
        return <Tag color="red">已删除</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  const getOrgPathName = (orgNodeId: string) => {
    const path = getPath(orgNodeId);
    return path.map((n) => n.name).join(' / ');
  };

  const getOrgName = (orgId: string) => {
    const node = getNodeById(orgId);
    return node?.name || '-';
  };

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 });
  };

  const handleReset = () => {
    setSearchKeyword('');
    setSelectedOrgNodeId(null);
    setStatusFilter('all');
    setPagination({ current: 1, pageSize: 10 });
  };

  const handleAdd = () => {
    setEditingPosition(null);
    form.resetFields();
    form.setFieldsValue({
      code: getNextCode(),
    });
    setModalVisible(true);
  };

  const handleEdit = (record: Position) => {
    setEditingPosition(record);
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      orgNodeId: record.orgNodeId,
      description: record.description,
      positionType: record.positionType,
      positionLevel: record.positionLevel,
      isInherited: record.isInherited,
    });
    setModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingPosition) {
        updatePosition(editingPosition.id, {
          name: values.name,
          code: values.code || editingPosition.code,
          orgNodeId: values.orgNodeId,
          description: values.description,
          positionType: values.positionType,
          positionLevel: values.positionLevel,
          isInherited: values.isInherited,
        });
        message.success('岗位更新成功');
      } else {
        addPosition({
          name: values.name,
          code: values.code || '',
          orgNodeId: values.orgNodeId,
          description: values.description,
          positionType: values.positionType,
          positionLevel: values.positionLevel,
          isInherited: values.isInherited,
          status: 'ACTIVE',
          functionSetIds: [],
          tenantId: 'tenant-001',
        } as any);
        message.success('岗位创建成功');
      }
      setModalVisible(false);
    } catch {
      // 表单验证失败
    }
  };

  const handleDeactivate = (record: Position) => {
    Modal.confirm({
      title: '确认停用',
      content: `确定要停用岗位「${record.name}」吗？`,
      onOk: () => {
        deactivatePosition(record.id);
        message.success('岗位已停用');
      },
    });
  };

  const handleActivate = (record: Position) => {
    Modal.confirm({
      title: '确认启用',
      content: `确定要启用岗位「${record.name}」吗？`,
      onOk: () => {
        activatePosition(record.id);
        message.success('岗位已启用');
      },
    });
  };

  const handleDelete = (record: Position) => {
    const users = getUsersByPosition(record.id);
    if (users.length > 0) {
      Modal.error({
        title: '无法删除',
        content: `该岗位关联${users.length}个用户，请先解除用户关联后再停用`,
      });
      return;
    }
    if (record.status !== 'INACTIVE') {
      Modal.error({
        title: '无法删除',
        content: '只有停用状态的岗位才能删除，请先停用该岗位。',
      });
      return;
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除岗位「${record.name}」吗？删除后可在已删除状态中恢复。`,
      okText: '确认删除',
      okButtonProps: { danger: true },
      onOk: () => {
        deletePosition(record.id);
        message.success('岗位已删除');
      },
    });
  };

  const handleRestore = (record: Position) => {
    Modal.confirm({
      title: '确认恢复',
      content: `确定要恢复岗位「${record.name}」吗？恢复后状态为启用。`,
      onOk: () => {
        restorePosition(record.id);
        message.success('岗位已恢复');
      },
    });
  };

  const handleViewDetail = (record: Position) => {
    setDetailPosition(record);
    setDetailVisible(true);
  };

  const handleAssignFunctionSet = (record: Position) => {
    setTargetPositionId(record.id);
    setTargetFunctionSetKeys([...record.functionSetIds]);
    setSelectedFunctionSetKeys([]);
    setFunctionSetSearchKeyword('');
    setFunctionSetModalVisible(true);
  };

  const handleFunctionSetSave = () => {
    if (!targetPositionId) return;
    const position = positions.find((p) => p.id === targetPositionId);
    if (!position) return;

    const toRemove = position.functionSetIds.filter((id) => !targetFunctionSetKeys.includes(id));
    const toAdd = targetFunctionSetKeys.filter((id) => !position.functionSetIds.includes(id));

    toRemove.forEach((id) => {
      usePositionStore.getState().unassignFunctionSet(targetPositionId, id);
    });
    toAdd.forEach((id) => {
      usePositionStore.getState().assignFunctionSet(targetPositionId, id);
    });

    message.success('职能集关联保存成功');
    setFunctionSetModalVisible(false);
  };

  const availableFunctionSets = useMemo(() => {
    let activeFs = getFunctionSetsByStatus('ACTIVE');
    if (functionSetSearchKeyword) {
      const kw = functionSetSearchKeyword.toLowerCase();
      activeFs = activeFs.filter(
        (fs) =>
          fs.name.toLowerCase().includes(kw) ||
          fs.code.toLowerCase().includes(kw)
      );
    }
    return activeFs;
  }, [getFunctionSetsByStatus, functionSetSearchKeyword]);

  const transferData = useMemo(
    () =>
      availableFunctionSets.map((fs) => ({
        key: fs.id,
        title: `${fs.name} (${fs.code})`,
        description: fs.description || '',
      })),
    [availableFunctionSets]
  );

  const detailFunctionSets = useMemo(() => {
    if (!detailPosition) return [];
    return detailPosition.functionSetIds
      .map((id) => useFunctionSetStore.getState().getFunctionSetById(id))
      .filter(Boolean) as FunctionSet[];
  }, [detailPosition]);

  const detailFunctionSetsForTarget = useCallback((ids: string[]) => {
    return ids
      .map((id) => useFunctionSetStore.getState().getFunctionSetById(id))
      .filter(Boolean) as FunctionSet[];
  }, []);

  const detailUsers = useMemo(() => {
    if (!detailPosition) return [];
    return getUsersByPosition(detailPosition.id);
  }, [detailPosition, getUsersByPosition]);

  const openFunctionSetEditModal = () => {
    if (!detailPosition) return;
    setTargetPositionId(detailPosition.id);
    setTargetFunctionSetKeys([...detailPosition.functionSetIds]);
    setSelectedFunctionSetKeys([]);
    setFunctionSetSearchKeyword('');
    setFunctionSetEditModalVisible(true);
  };

  const handleFunctionSetEditSave = () => {
    if (!targetPositionId) return;
    const position = positions.find((p) => p.id === targetPositionId);
    if (!position) return;

    const toRemove = position.functionSetIds.filter((id) => !targetFunctionSetKeys.includes(id));
    const toAdd = targetFunctionSetKeys.filter((id) => !position.functionSetIds.includes(id));

    toRemove.forEach((id) => {
      usePositionStore.getState().unassignFunctionSet(targetPositionId, id);
    });
    toAdd.forEach((id) => {
      usePositionStore.getState().assignFunctionSet(targetPositionId, id);
    });

    if (detailPosition && detailPosition.id === targetPositionId) {
      setDetailPosition({ ...detailPosition, functionSetIds: [...targetFunctionSetKeys] });
    }

    message.success('职能集关联保存成功');
    setFunctionSetEditModalVisible(false);
  };

  const columns: ColumnsType<Position> = [
    {
      title: '岗位名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '所属组织',
      dataIndex: 'orgNodeId',
      key: 'orgNodeId',
      render: (orgNodeId: string) => getOrgPathName(orgNodeId),
    },
    {
      title: '关联职能集',
      dataIndex: 'functionSetIds',
      key: 'functionSets',
      width: 240,
      render: (ids: string[]) => {
        const fsList = ids
          .map((id) => functionSets.find((fs) => fs.id === id))
          .filter(Boolean) as FunctionSet[];
        if (fsList.length === 0) return <Text type="secondary">-</Text>;
        return (
          <Space size={[4, 4]} wrap>
            {fsList.slice(0, 3).map((fs) => (
              <Tag key={fs.id} color="blue">
                {fs.name}
              </Tag>
            ))}
            {fsList.length > 3 && (
              <Tag>+{fsList.length - 3}</Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            查看
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" icon={<TeamOutlined />} onClick={() => handleAssignFunctionSet(record)}>
            关联职能集
          </Button>
          {record.status === 'DELETED' ? (
            <Button type="link" size="small" icon={<RollbackOutlined />} onClick={() => handleRestore(record)}>
              恢复
            </Button>
          ) : (
            <Dropdown
              menu={{
                items: [
                  ...(record.status === 'ACTIVE'
                    ? [
                        {
                          key: 'deactivate',
                          icon: <StopOutlined />,
                          label: '停用',
                          danger: true,
                          onClick: () => handleDeactivate(record),
                        },
                      ]
                    : []),
                  ...(record.status === 'INACTIVE'
                    ? [
                        {
                          key: 'activate',
                          icon: <PlayCircleOutlined />,
                          label: '启用',
                          onClick: () => handleActivate(record),
                        },
                      ]
                    : []),
                  { type: 'divider' as const },
                  {
                    key: 'delete',
                    icon: <DeleteOutlined />,
                    label: '删除',
                    danger: true,
                    onClick: () => handleDelete(record),
                  },
                ] as MenuProps['items'],
              }}
            >
              <Button type="link" size="small" icon={<MoreOutlined />}>
                更多
              </Button>
            </Dropdown>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="岗位管理" subTitle="管理组织中的岗位信息">
      <Row gutter={16}>
        <Col xs={24} lg={6} xl={5}>
          <Card
            bodyStyle={{ padding: '12px 0 0 0' }}
            style={{ borderRadius: 8 }}
          >
            <Tabs
              activeKey={orgTypeTab}
              onChange={(key) => {
                setOrgTypeTab(key as 'VERTICAL' | 'HORIZONTAL');
                setSelectedOrgNodeId(null);
                setExpandedKeys([]);
              }}
              size="small"
              style={{ padding: '0 12px' }}
              items={[
                { key: 'VERTICAL', label: '职能型' },
                { key: 'HORIZONTAL', label: '项目型' },
              ]}
            />
            <div style={{ padding: '0 12px 12px 12px' }}>
              <Input
                placeholder="搜索组织节点"
                prefix={<SearchOutlined />}
                value={treeSearchKeyword}
                onChange={(e) => setTreeSearchKeyword(e.target.value)}
                allowClear
                style={{ marginBottom: 12 }}
              />
              <Tree
                treeData={displayTreeData as DataNode[]}
                selectedKeys={selectedOrgNodeId ? [selectedOrgNodeId] : []}
                expandedKeys={expandedKeys}
                onExpand={(keys) => setExpandedKeys(keys)}
                onSelect={handleTreeSelect as any}
                showLine={{ showLeafIcon: false }}
                defaultExpandAll={true}
                style={{ maxHeight: 'calc(100vh - 320px)', overflow: 'auto' }}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={18} xl={19}>
          <Card style={{ marginBottom: 16, borderRadius: 8 }}>
            <Row gutter={[16, 16]} align="bottom">
              <Col xs={24} sm={12} md={8} lg={6}>
                <div style={{ marginBottom: 8, color: '#666' }}>岗位名称/编码</div>
                <Input
                  placeholder="请输入岗位名称/编码"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div style={{ marginBottom: 8, color: '#666' }}>状态</div>
                <Select
                  placeholder="请选择状态"
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value)}
                  style={{ width: '100%' }}
                >
                  <Option value="all">全部</Option>
                  <Option value="ACTIVE">启用</Option>
                  <Option value="INACTIVE">停用</Option>
                  <Option value="DELETED">已删除</Option>
                </Select>
              </Col>
              <Col xs={24} sm={24} md={8} lg={12} style={{ textAlign: 'right' }}>
                <Space>
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

          <Card style={{ borderRadius: 8 }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                新建岗位
              </Button>
              {selectedOrgNodeId && (
                <Tag color="blue">
                  组织：{getOrgName(selectedOrgNodeId)}
                </Tag>
              )}
            </div>

            <Table
              rowKey="id"
              columns={columns}
              dataSource={paginatedPositions}
              pagination={{
                ...pagination,
                total: filteredPositions.length,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
                onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
              }}
              scroll={{ x: 1000 }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={editingPosition ? '编辑岗位' : '新建岗位'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            label="岗位编码"
            name="code"
          >
            <Input placeholder="请输入岗位编码（可留空）" allowClear />
          </Form.Item>
          <Form.Item
            label="岗位名称"
            name="name"
            rules={[{ required: true, message: '请输入岗位名称' }]}
          >
            <Input placeholder="请输入岗位名称" maxLength={50} />
          </Form.Item>
          <Form.Item
            label="所属组织"
            name="orgNodeId"
            rules={[{ required: true, message: '请选择所属组织' }]}
          >
            <TreeSelect
              placeholder="请选择所属组织"
              treeData={orgTreeData}
              treeDefaultExpandAll
              allowClear
            />
          </Form.Item>
          <Form.Item
            label="岗位类型"
            name="positionType"
            rules={[{ required: true, message: '请选择岗位类型' }]}
          >
            <Select placeholder="请选择岗位类型">
              <Option value="MANAGEMENT">管理岗位</Option>
              <Option value="NON_MANAGEMENT">非管理岗</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="岗位级别"
            name="positionLevel"
            rules={[{ required: true, message: '请选择岗位级别' }]}
          >
            <Select placeholder="请选择岗位级别">
              <Option value="P0">P0</Option>
              <Option value="P1">P1</Option>
              <Option value="P2">P2</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="岗位是否继承"
            name="isInherited"
            rules={[{ required: true, message: '请选择岗位是否继承' }]}
          >
            <Select placeholder="请选择">
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
          </Form.Item>
          <Form.Item label="岗位描述" name="description">
            <TextArea rows={3} placeholder="请输入岗位描述" maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="岗位详情"
        width={640}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {detailPosition && (
          <div>
            <Descriptions title="基本信息" bordered column={1} size="small">
              <Descriptions.Item label="岗位编码">{detailPosition.code}</Descriptions.Item>
              <Descriptions.Item label="岗位名称">{detailPosition.name}</Descriptions.Item>
              <Descriptions.Item label="所属组织">{getOrgPathName(detailPosition.orgNodeId)}</Descriptions.Item>
              <Descriptions.Item label="岗位类型">
                {detailPosition.positionType === 'MANAGEMENT' ? '管理岗位' : detailPosition.positionType === 'NON_MANAGEMENT' ? '非管理岗' : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="岗位级别">{detailPosition.positionLevel || '-'}</Descriptions.Item>
              <Descriptions.Item label="岗位是否继承">
                {detailPosition.isInherited === true ? '是' : detailPosition.isInherited === false ? '否' : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(detailPosition.status)}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{formatDateTime(detailPosition.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{formatDateTime(detailPosition.updatedAt)}</Descriptions.Item>
              <Descriptions.Item label="岗位描述">
                {detailPosition.description || '暂无描述'}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ margin: 0 }}>关联职能集 ({detailFunctionSets.length})</h4>
              </div>
              {detailFunctionSets.length > 0 ? (
                <List
                  size="small"
                  bordered
                  dataSource={detailFunctionSets}
                  renderItem={(fs) => (
                    <List.Item>
                      <List.Item.Meta
                        title={`${fs.name} (${fs.code})`}
                        description={fs.description}
                      />
                      <Tag color="green">已关联</Tag>
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ color: '#999', padding: 16, textAlign: 'center', border: '1px solid #f0f0f0', borderRadius: 4 }}>
                  暂无关联职能集
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* 关联职能集模态框（列表页调用） */}
      <Modal
        title={
          targetPositionId && positions.find(p => p.id === targetPositionId) &&
            positions.find(p => p.id === targetPositionId)!.functionSetIds.length > 0
            ? '编辑关联职能集'
            : '新增关联职能集'
        }
        open={functionSetModalVisible}
        onOk={handleFunctionSetSave}
        onCancel={() => setFunctionSetModalVisible(false)}
        width={760}
        destroyOnClose
        zIndex={1100}
      >
        {targetPositionId && (() => {
          const position = positions.find(p => p.id === targetPositionId);
          if (!position) return null;
          const linkedFs = detailFunctionSetsForTarget(targetFunctionSetKeys);
          return (
            <>
              <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                <Space>
                  <Text type="secondary">当前岗位：</Text>
                  <Text strong>{position.name}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{position.code}</Text>
                </Space>
              </div>

              {linkedFs.length > 0 && (
                <>
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>已关联职能集（{linkedFs.length}）</div>
                  <List
                    size="small"
                    bordered
                    dataSource={linkedFs}
                    renderItem={(fs: FunctionSet) => (
                      <List.Item>
                        <List.Item.Meta
                          title={fs.name}
                          description={`${fs.code}`}
                        />
                        <Tag color="green">已关联</Tag>
                      </List.Item>
                    )}
                    style={{ marginBottom: 16 }}
                  />
                </>
              )}

              <Divider style={{ margin: '12px 0' }} />

              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary">从可用职能集中选择要关联的职能集：</Text>
                <Input.Search
                  placeholder="搜索职能集名称"
                  allowClear
                  style={{ width: 220 }}
                  value={functionSetSearchKeyword}
                  onChange={(e) => setFunctionSetSearchKeyword(e.target.value)}
                />
              </div>

              <Transfer
                dataSource={transferData.filter((d) => {
                  if (!functionSetSearchKeyword) return true;
                  const kw = functionSetSearchKeyword.toLowerCase();
                  return d.title.toLowerCase().includes(kw);
                })}
                titles={['可关联职能集', '已关联职能集']}
                targetKeys={targetFunctionSetKeys}
                selectedKeys={selectedFunctionSetKeys}
                onChange={(nextTargetKeys) => setTargetFunctionSetKeys(nextTargetKeys as string[])}
                onSelectChange={(sourceSelectedKeys, targetSelectedKeys) => {
                  setSelectedFunctionSetKeys([...(sourceSelectedKeys as string[]), ...(targetSelectedKeys as string[])]);
                }}
                render={(item) => item.title}
                listStyle={{ width: 280, height: 360 }}
                showSearch
                filterOption={(inputValue, option) =>
                  option.title.toLowerCase().includes(inputValue.toLowerCase())
                }
              />
            </>
          );
        })()}
      </Modal>

      {/* 关联职能集编辑模态框（详情页调用） */}
      <Modal
        title={
          detailPosition && detailPosition.functionSetIds.length > 0
            ? '编辑关联职能集'
            : '新增关联职能集'
        }
        open={functionSetEditModalVisible}
        onOk={handleFunctionSetEditSave}
        onCancel={() => setFunctionSetEditModalVisible(false)}
        width={760}
        destroyOnClose
        zIndex={1100}
      >
        {detailPosition && (
          <>
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <Space>
                <Text type="secondary">当前岗位：</Text>
                <Text strong>{detailPosition.name}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{detailPosition.code}</Text>
              </Space>
            </div>

            {detailFunctionSets.length > 0 && (
              <>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>已关联职能集（{detailFunctionSets.length}）</div>
                <List
                  size="small"
                  bordered
                  dataSource={detailFunctionSets}
                  renderItem={(fs) => (
                    <List.Item>
                      <List.Item.Meta
                        title={fs.name}
                        description={`${fs.code}`}
                      />
                      <Tag color="green">已关联</Tag>
                    </List.Item>
                  )}
                  style={{ marginBottom: 16 }}
                />
              </>
            )}

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary">从可用职能集中选择要关联的职能集：</Text>
              <Input.Search
                placeholder="搜索职能集名称"
                allowClear
                style={{ width: 220 }}
                value={functionSetSearchKeyword}
                onChange={(e) => setFunctionSetSearchKeyword(e.target.value)}
              />
            </div>

            <Transfer
              dataSource={transferData.filter((d) => {
                if (!functionSetSearchKeyword) return true;
                const kw = functionSetSearchKeyword.toLowerCase();
                return d.title.toLowerCase().includes(kw);
              })}
              titles={['可关联职能集', '已关联职能集']}
              targetKeys={targetFunctionSetKeys}
              selectedKeys={selectedFunctionSetKeys}
              onChange={(nextTargetKeys) => setTargetFunctionSetKeys(nextTargetKeys as string[])}
              onSelectChange={(sourceSelectedKeys, targetSelectedKeys) => {
                setSelectedFunctionSetKeys([...(sourceSelectedKeys as string[]), ...(targetSelectedKeys as string[])]);
              }}
              render={(item) => item.title}
              listStyle={{ width: 280, height: 360 }}
              showSearch
              filterOption={(inputValue, option) =>
                option.title.toLowerCase().includes(inputValue.toLowerCase())
              }
            />
          </>
        )}
      </Modal>
    </PageContainer>
  );
}
