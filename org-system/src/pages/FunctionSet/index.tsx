import { useState, useMemo } from 'react';
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
  Descriptions,
  Dropdown,
  message,
  Row,
  Col,
  Tooltip,
  Tree,
  Radio,
  Divider,
  Switch,
} from 'antd';
import type { ColumnsType, TableRowSelection } from 'antd/es/table/interface';
import type { DataNode } from 'antd/es/tree';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  StopOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  MoreOutlined,
  EyeOutlined,
  RollbackOutlined,
  SettingOutlined,
  AppstoreOutlined,
  DownOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import PageContainer from '@/components/PageContainer';
import { useFunctionSetStore } from '@/store/functionSetStore';
import { usePositionStore } from '@/store/positionStore';
import { useResourceStore } from '@/store/resourceStore';
import { useOrgStore } from '@/store/orgStore';
import { formatDateTime } from '@/utils/dateUtils';
import type { FunctionSet, OrgNodeStatus, Resource, OrgNode, DataPermissionConfig } from '@/types';

const { Option } = Select;
const { TextArea } = Input;

interface FunctionSetFormValues {
  name: string;
  description?: string;
}

const statusOptions = [
  { label: '全部', value: 'ALL' },
  { label: '启用', value: 'ACTIVE' },
  { label: '停用', value: 'INACTIVE' },
  { label: '已删除', value: 'DELETED' },
];

const statusTagMap: Record<OrgNodeStatus, { color: string; text: string }> = {
  ACTIVE: { color: 'green', text: '启用' },
  INACTIVE: { color: 'default', text: '停用' },
  DELETED: { color: 'default', text: '已删除' },
};

const dataScopeOptions = [
  { label: '本机构', value: 'COMPANY' },
  { label: '本部门', value: 'DEPT' },
  { label: '本部门及下级部门', value: 'DEPT_AND_CHILD' },
  { label: '指定部门', value: 'CUSTOM' },
  { label: '本人', value: 'SELF' },
];

export default function FunctionSetManagement() {
  const {
    functionSets,
    addFunctionSet,
    updateFunctionSet,
    getNextCode,
    activateFunctionSet,
    deactivateFunctionSet,
  } = useFunctionSetStore();
  const { positions, getPositionsByFunctionSet } = usePositionStore();
  const { resources, getTree, getFlatList } = useResourceStore();
  const { getTree: getOrgTree, getNodeById } = useOrgStore();

  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showDeleted, setShowDeleted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [currentFunctionSet, setCurrentFunctionSet] = useState<FunctionSet | null>(null);
  const [form] = Form.useForm<FunctionSetFormValues>();

  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailFunctionSet, setDetailFunctionSet] = useState<FunctionSet | null>(null);

  const [functionPermissionDrawerOpen, setFunctionPermissionDrawerOpen] = useState(false);
  const [permissionFunctionSet, setPermissionFunctionSet] = useState<FunctionSet | null>(null);
  const [checkedResourceKeys, setCheckedResourceKeys] = useState<React.Key[]>([]);
  const [halfCheckedResourceKeys, setHalfCheckedResourceKeys] = useState<React.Key[]>([]);

  const [dataPermissionDrawerOpen, setDataPermissionDrawerOpen] = useState(false);
  const [dataPermFunctionSet, setDataPermFunctionSet] = useState<FunctionSet | null>(null);
  const [dataScope, setDataScope] = useState<string>('DEPT');
  const [selectedDeptIds, setSelectedDeptIds] = useState<React.Key[]>([]);

  const filteredFunctionSets = useMemo(() => {
    let result = [...functionSets];

    if (!showDeleted) {
      result = result.filter((fs) => fs.status !== 'DELETED');
    }

    if (keyword) {
      const kw = keyword.toLowerCase();
      result = result.filter(
        (fs) =>
          fs.name.toLowerCase().includes(kw) ||
          fs.code.toLowerCase().includes(kw) ||
          (fs.description && fs.description.toLowerCase().includes(kw))
      );
    }

    if (statusFilter !== 'ALL') {
      result = result.filter((fs) => fs.status === statusFilter);
    }

    return result;
  }, [functionSets, keyword, statusFilter, showDeleted]);

  const paginatedFunctionSets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFunctionSets.slice(start, start + pageSize);
  }, [filteredFunctionSets, currentPage, pageSize]);

  const resourceTreeData = useMemo<DataNode[]>(() => {
    const buildTree = (items: Resource[]): DataNode[] => {
      return items
        .filter((r) => r.status === 'ACTIVE')
        .map((r) => ({
          title: r.name,
          key: r.id,
          children: r.children ? buildTree(r.children) : undefined,
        }));
    };
    return buildTree(getTree());
  }, [getTree]);

  const orgTreeData = useMemo<DataNode[]>(() => {
    type OrgTreeNode = OrgNode & { children?: OrgTreeNode[] };
    const buildTree = (nodes: OrgTreeNode[]): DataNode[] => {
      return nodes
        .filter((n) => n.status === 'ACTIVE')
        .map((node) => ({
          title: node.name,
          key: node.id,
          children: node.children ? buildTree(node.children) : undefined,
        }));
    };
    return buildTree(getOrgTree() as OrgTreeNode[]);
  }, [getOrgTree]);

  const getPositionCount = (functionSetId: string) => {
    return getPositionsByFunctionSet(functionSetId).length;
  };

  const getResourceCount = (functionSetId: string) => {
    const fs = functionSets.find((f) => f.id === functionSetId);
    return fs?.resourceIds.length || 0;
  };

  const getPositionNames = (functionSetId: string) => {
    return getPositionsByFunctionSet(functionSetId)
      .map((p) => p.name)
      .join('、');
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleReset = () => {
    setKeyword('');
    setStatusFilter('ALL');
    setCurrentPage(1);
  };

  const handleAdd = () => {
    setModalType('add');
    setCurrentFunctionSet(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (fs: FunctionSet) => {
    setModalType('edit');
    setCurrentFunctionSet(fs);
    form.setFieldsValue({
      name: fs.name,
      description: fs.description,
    });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (modalType === 'add') {
        addFunctionSet({
          name: values.name,
          description: values.description,
          status: 'ACTIVE',
          resourceIds: [],
        });
        message.success('职能集创建成功');
      } else if (modalType === 'edit' && currentFunctionSet) {
        updateFunctionSet(currentFunctionSet.id, {
          name: values.name,
          description: values.description,
        });
        message.success('职能集更新成功');
      }

      setModalOpen(false);
    } catch {
      // 表单验证失败
    }
  };

  const handleDeactivate = (fs: FunctionSet) => {
    Modal.confirm({
      title: '确认停用',
      content: `确定要停用职能集 "${fs.name}" 吗？`,
      okText: '确认停用',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        deactivateFunctionSet(fs.id);
        message.success('职能集已停用');
      },
    });
  };

  const handleActivate = (fs: FunctionSet) => {
    Modal.confirm({
      title: '确认启用',
      content: `确定要启用职能集 "${fs.name}" 吗？`,
      okText: '确认启用',
      cancelText: '取消',
      onOk: () => {
        activateFunctionSet(fs.id);
        message.success('职能集已启用');
      },
    });
  };

  const handleDelete = (fs: FunctionSet) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除职能集 "${fs.name}" 吗？删除后将解除与岗位的关联关系，可在"已删除"状态中恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        updateFunctionSet(fs.id, { status: 'DELETED' });
        message.success('职能集已删除');
      },
    });
  };

  const handleRestore = (fs: FunctionSet) => {
    Modal.confirm({
      title: '确认恢复',
      content: `确定要恢复职能集 "${fs.name}" 吗？恢复后状态将变为启用。`,
      okText: '确认恢复',
      cancelText: '取消',
      onOk: () => {
        activateFunctionSet(fs.id);
        message.success('职能集已恢复');
      },
    });
  };

  const handleViewDetail = (fs: FunctionSet) => {
    setDetailFunctionSet(fs);
    setDetailDrawerOpen(true);
  };

  const handleConfigFunctionPermission = (fs: FunctionSet) => {
    setPermissionFunctionSet(fs);
    setCheckedResourceKeys(fs.resourceIds);
    setHalfCheckedResourceKeys([]);
    setFunctionPermissionDrawerOpen(true);
  };

  const handleConfigDataPermission = (fs: FunctionSet) => {
    setDataPermFunctionSet(fs);
    setDataScope(fs.dataPermission?.scope || 'DEPT');
    setSelectedDeptIds(fs.dataPermission?.deptIds || []);
    setDataPermissionDrawerOpen(true);
  };

  const handleFunctionPermissionSave = () => {
    if (permissionFunctionSet) {
      updateFunctionSet(permissionFunctionSet.id, {
        resourceIds: checkedResourceKeys as string[],
      });
      message.success('功能权限配置成功');
      setFunctionPermissionDrawerOpen(false);
    }
  };

  const handleDataPermissionSave = () => {
    if (dataPermFunctionSet) {
      const dataPermission: DataPermissionConfig = {
        scope: dataScope,
        deptIds: dataScope === 'CUSTOM' ? (selectedDeptIds as string[]) : [],
      };
      updateFunctionSet(dataPermFunctionSet.id, { dataPermission });
      message.success('数据权限配置成功');
      setDataPermissionDrawerOpen(false);
    }
  };

  const onResourceCheck = (checked: {
    checked: React.Key[];
    halfChecked: React.Key[];
  }) => {
    setCheckedResourceKeys(checked.checked);
    setHalfCheckedResourceKeys(checked.halfChecked);
  };

  const columns: ColumnsType<FunctionSet> = [
    {
      title: '职能集编码',
      dataIndex: 'code',
      key: 'code',
      width: 140,
    },
    {
      title: '职能集名称',
      dataIndex: 'name',
      key: 'name',
      width: 160,
    },
    {
      title: '关联岗位数',
      key: 'positionCount',
      width: 120,
      render: (_, record) => getPositionCount(record.id),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: OrgNodeStatus) => (
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
      width: 280,
      fixed: 'right',
      render: (_, record) => {
        const isDeleted = record.status === 'DELETED';

        if (isDeleted) {
          return (
            <Space size="small">
              <Button
                type="link"
                size="small"
                icon={<RollbackOutlined />}
                onClick={() => handleRestore(record)}
              >
                恢复
              </Button>
            </Space>
          );
        }

        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
            {record.status === 'ACTIVE' ? (
              <Button
                type="link"
                size="small"
                icon={<StopOutlined />}
                onClick={() => handleDeactivate(record)}
              >
                停用
              </Button>
            ) : (
              <Button
                type="link"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleActivate(record)}
              >
                启用
              </Button>
            )}
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'view',
                    icon: <EyeOutlined />,
                    label: '查看详情',
                    onClick: () => handleViewDetail(record),
                  },
                  {
                    key: 'functionPermission',
                    icon: <AppstoreOutlined />,
                    label: '配置功能权限',
                    onClick: () => handleConfigFunctionPermission(record),
                  },
                  {
                    key: 'dataPermission',
                    icon: <SafetyCertificateOutlined />,
                    label: '配置数据权限',
                    onClick: () => handleConfigDataPermission(record),
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

  return (
    <PageContainer title="职能集管理" subTitle="管理系统职能集及权限配置">
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} sm={12} md={8} lg={6}>
            <div style={{ marginBottom: 8, color: '#666' }}>职能集名称/编码</div>
            <Input
              placeholder="请输入名称/编码"
              prefix={<SettingOutlined />}
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
              {statusOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={24} md={8} lg={6}>
            <div style={{ marginBottom: 8, color: '#666' }}>已删除记录</div>
            <Space>
              <span>展示已删除记录</span>
              <Switch checked={showDeleted} onChange={setShowDeleted} />
            </Space>
          </Col>
          <Col xs={24} sm={24} md={8} lg={6} style={{ textAlign: 'right' }}>
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

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新建职能集
            </Button>
          </Space>
        </div>

        <Table<FunctionSet>
          rowKey="id"
          columns={columns}
          dataSource={paginatedFunctionSets}
          scroll={{ x: 1200 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredFunctionSets.length,
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

      <Modal
        title={modalType === 'add' ? '新建职能集' : '编辑职能集'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        okText="确定"
        cancelText="取消"
        width={520}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="职能集编码"
            name="code"
          >
            <Input
              value={modalType === 'add' ? getNextCode() : currentFunctionSet?.code}
              disabled
            />
          </Form.Item>
          <Form.Item
            label="职能集名称"
            name="name"
            rules={[
              { required: true, message: '请输入职能集名称' },
              { max: 50, message: '名称长度不能超过50个字符' },
            ]}
          >
            <Input placeholder="请输入职能集名称" />
          </Form.Item>
          <Form.Item
            label="描述"
            name="description"
            rules={[{ max: 200, message: '描述长度不能超过200个字符' }]}
          >
            <TextArea rows={4} placeholder="请输入描述" maxLength={200} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="职能集详情"
        placement="right"
        width={520}
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
      >
        {detailFunctionSet && (
          <>
            <Descriptions
              title="基本信息"
              column={1}
              bordered
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="职能集编码">
                {detailFunctionSet.code}
              </Descriptions.Item>
              <Descriptions.Item label="职能集名称">
                {detailFunctionSet.name}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusTagMap[detailFunctionSet.status].color}>
                  {statusTagMap[detailFunctionSet.status].text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="描述">
                {detailFunctionSet.description || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {formatDateTime(detailFunctionSet.createdAt)}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions
              title="关联统计"
              column={1}
              bordered
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="关联岗位数">
                {getPositionCount(detailFunctionSet.id)}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">关联岗位列表</Divider>
            <div style={{ maxHeight: 300, overflow: 'auto' }}>
              {getPositionsByFunctionSet(detailFunctionSet.id).length > 0 ? (
                getPositionsByFunctionSet(detailFunctionSet.id).map((pos) => (
                  <div
                    key={pos.id}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #f0f0f0',
                      borderRadius: 4,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontWeight: 500 }}>{pos.name}</div>
                    <div style={{ color: '#999', fontSize: 12 }}>{pos.code}</div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                  暂无关联岗位
                </div>
              )}
            </div>
          </>
        )}
      </Drawer>

      <Drawer
        title="配置功能权限"
        placement="right"
        width={480}
        open={functionPermissionDrawerOpen}
        onClose={() => setFunctionPermissionDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setFunctionPermissionDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleFunctionPermissionSave}>
              保存
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, color: '#666' }}>
            职能集：{permissionFunctionSet?.name}
          </div>
        </div>
        <div
          style={{
            border: '1px solid #f0f0f0',
            borderRadius: 4,
            padding: 12,
            maxHeight: 'calc(100vh - 200px)',
            overflow: 'auto',
          }}
        >
          <Tree
            checkable
            defaultExpandAll
            treeData={resourceTreeData}
            checkedKeys={{ checked: checkedResourceKeys, halfChecked: halfCheckedResourceKeys }}
            onCheck={onResourceCheck as any}
          />
        </div>
      </Drawer>

      <Drawer
        title="配置数据权限"
        placement="right"
        width={480}
        open={dataPermissionDrawerOpen}
        onClose={() => setDataPermissionDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setDataPermissionDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleDataPermissionSave}>
              保存
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, color: '#666' }}>
            职能集：{dataPermFunctionSet?.name}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>数据范围</div>
          <Radio.Group
            value={dataScope}
            onChange={(e) => setDataScope(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical">
              {dataScopeOptions.map((opt) => (
                <Radio key={opt.value} value={opt.value}>
                  {opt.label}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </div>

        {dataScope === 'CUSTOM' && (
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>选择部门</div>
            <div
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 4,
                padding: 12,
                maxHeight: 400,
                overflow: 'auto',
              }}
            >
              <Tree
                checkable
                defaultExpandAll
                treeData={orgTreeData}
                checkedKeys={selectedDeptIds}
                onCheck={(checked) => setSelectedDeptIds(checked as React.Key[])}
              />
            </div>
          </div>
        )}
      </Drawer>
    </PageContainer>
  );
}
