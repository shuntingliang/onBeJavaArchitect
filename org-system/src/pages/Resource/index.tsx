import { useState, useMemo } from 'react';
import {
  Button,
  Input,
  Select,
  Space,
  Card,
  Tag,
  Modal,
  Form,
  InputNumber,
  Table,
  message,
  Row,
  Col,
  TreeSelect,
  Radio,
  Switch,
} from 'antd';
import type { ColumnsType } from 'antd/es/table/interface';
import type { TreeSelectProps } from 'antd/es/tree-select';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  StopOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  MenuOutlined,
  BgColorsOutlined,
  FolderOutlined,
  ReloadOutlined,
  ExpandAltOutlined,
  ShrinkOutlined,
  AppstoreOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import PageContainer from '@/components/PageContainer';
import { useResourceStore } from '@/store/resourceStore';
import type { Resource, ResourceType, OrgNodeStatus } from '@/types';

const { Option } = Select;

interface ResourceFormValues {
  name: string;
  parentId?: string | null;
  type: ResourceType;
  path?: string;
  icon?: string;
  sort: number;
  status: OrgNodeStatus;
  visible: boolean;
  permissionCode?: string;
}

const resourceTypeMap: Record<ResourceType, { label: string; color: string; icon: React.ReactNode }> = {
  CATALOG: { label: '目录', color: 'blue', icon: <FolderOutlined /> },
  MENU: { label: '菜单', color: 'green', icon: <MenuOutlined /> },
  BUTTON: { label: '按钮', color: 'purple', icon: <BgColorsOutlined /> },
};

const statusTagMap: Record<OrgNodeStatus, { color: string; text: string }> = {
  ACTIVE: { color: 'green', text: '正常' },
  INACTIVE: { color: 'default', text: '停用' },
  DELETED: { color: 'default', text: '已删除' },
};

export default function ResourceManagement() {
  const {
    resources,
    getResourceById,
    getChildren,
    getDescendants,
    getTree,
    getFlatList,
    addResource,
    updateResource,
    activateResource,
    deactivateResource,
    getNextCode,
  } = useResourceStore();

  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [currentResource, setCurrentResource] = useState<Resource | null>(null);
  const [form] = Form.useForm<ResourceFormValues>();

  const allResourceIds = useMemo(() => {
    return getFlatList().map((r) => r.id);
  }, [getFlatList]);

  const treeSelectData = useMemo<TreeSelectProps['treeData']>(() => {
    const buildTree = (items: Resource[]): TreeSelectProps['treeData'] => {
      return items
        .filter((r) => r.status !== 'DELETED' && (r.type === 'CATALOG' || r.type === 'MENU'))
        .map((r) => ({
          title: r.name,
          value: r.id,
          key: r.id,
          children: r.children ? buildTree(r.children) : undefined,
        }));
    };
    return [{ title: '根节点', value: null, key: 'root', children: buildTree(getTree()) }];
  }, [getTree]);

  const tableData = useMemo(() => {
    const buildTree = (items: Resource[]): any[] => {
      return items
        .filter((r) => showDeleted || r.status !== 'DELETED')
        .map((r) => {
          const hasChildren = r.children && r.children.length > 0 && r.children.some((c) => showDeleted || c.status !== 'DELETED');
          return {
            ...r,
            children: hasChildren ? buildTree(r.children!) : undefined,
          };
        });
    };
    return buildTree(getTree());
  }, [getTree, showDeleted]);

  const filteredData = useMemo(() => {
    if (!keyword && !statusFilter) return tableData;

    const kw = keyword.toLowerCase();

    const filterTree = (nodes: any[]): any[] => {
      const result: any[] = [];
      nodes.forEach((node) => {
        const nameMatch = node.name.toLowerCase().includes(kw);
        const statusMatch = !statusFilter || node.status === statusFilter;
        const match = (!keyword || nameMatch) && statusMatch;
        const filteredChildren = node.children ? filterTree(node.children) : [];

        if (match || filteredChildren.length > 0) {
          result.push({
            ...node,
            children: filteredChildren.length > 0 ? filteredChildren : undefined,
          });
        }
      });
      return result;
    };

    return filterTree(tableData);
  }, [keyword, statusFilter, tableData, showDeleted]);

  const hasChildren = (resourceId: string): boolean => {
    const descendants = getDescendants(resourceId);
    return descendants.filter((d) => d.status !== 'DELETED').length > 0;
  };

  const getDescendantCount = (resourceId: string): number => {
    const descendants = getDescendants(resourceId);
    return descendants.filter((d) => d.status !== 'DELETED').length;
  };

  const handleExpandAll = () => {
    setExpandedRowKeys(allResourceIds);
  };

  const handleCollapseAll = () => {
    setExpandedRowKeys([]);
  };

  const handleReset = () => {
    setKeyword('');
    setStatusFilter('');
  };

  const handleAdd = (parentId?: string) => {
    setModalType('add');
    setCurrentResource(null);
    form.resetFields();
    const parent = parentId ? getResourceById(parentId) : null;
    let defaultType: ResourceType = 'CATALOG';
    if (parent) {
      if (parent.type === 'CATALOG') {
        defaultType = 'MENU';
      } else if (parent.type === 'MENU') {
        defaultType = 'BUTTON';
      }
    }
    form.setFieldsValue({
      parentId: parentId || null,
      type: defaultType,
      sort: 1,
      status: 'ACTIVE',
      visible: true,
    });
    setModalOpen(true);
  };

  const handleEdit = (resource: Resource) => {
    setModalType('edit');
    setCurrentResource(resource);
    form.setFieldsValue({
      name: resource.name,
      parentId: resource.parentId,
      type: resource.type,
      path: resource.path,
      icon: resource.icon,
      sort: resource.sort,
      status: resource.status,
      visible: resource.status !== 'INACTIVE',
      permissionCode: resource.code,
    });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (modalType === 'add') {
        addResource({
          name: values.name,
          parentId: values.parentId || null,
          type: values.type,
          path: values.path,
          icon: values.icon,
          sort: values.sort,
          status: values.visible ? 'ACTIVE' : 'INACTIVE',
        });
        message.success('资源创建成功');
      } else if (modalType === 'edit' && currentResource) {
        updateResource(currentResource.id, {
          name: values.name,
          path: values.path,
          icon: values.icon,
          sort: values.sort,
          status: values.visible ? 'ACTIVE' : 'INACTIVE',
        });
        message.success('资源更新成功');
      }

      setModalOpen(false);
    } catch {
      // 表单验证失败
    }
  };

  const handleDeactivate = (resource: Resource) => {
    const descendantCount = getDescendantCount(resource.id);
    const content = descendantCount > 0
      ? `确定要停用资源 "${resource.name}" 吗？停用后，其下 ${descendantCount} 个子资源也将被同步停用。`
      : `确定要停用资源 "${resource.name}" 吗？`;

    Modal.confirm({
      title: '确认停用',
      content: content,
      okText: '确认停用',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        deactivateResource(resource.id, true);
        message.success('资源已停用');
      },
    });
  };

  const handleActivate = (resource: Resource) => {
    const descendantCount = getDescendantCount(resource.id);
    const content = descendantCount > 0
      ? `确定要启用资源 "${resource.name}" 吗？启用后，其下 ${descendantCount} 个子资源也将被同步启用。`
      : `确定要启用资源 "${resource.name}" 吗？`;

    Modal.confirm({
      title: '确认启用',
      content: content,
      okText: '确认启用',
      cancelText: '取消',
      onOk: () => {
        activateResource(resource.id, true);
        message.success('资源已启用');
      },
    });
  };

  const handleDelete = (resource: Resource) => {
    if (hasChildren(resource.id)) {
      message.warning('该资源存在子资源，请先删除子资源');
      return;
    }

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除资源 "${resource.name}" 吗？`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        updateResource(resource.id, { status: 'DELETED' });
        message.success('资源已删除');
      },
    });
  };

  const handleRestore = (resource: Resource) => {
    Modal.confirm({
      title: '确认恢复',
      content: `确定要恢复资源 "${resource.name}" 吗？恢复后状态将变为启用。`,
      okText: '确认恢复',
      cancelText: '取消',
      onOk: () => {
        updateResource(resource.id, { status: 'ACTIVE' });
        message.success('资源已恢复');
      },
    });
  };

  const columns: ColumnsType<Resource> = [
    {
      title: '资源名称',
      dataIndex: 'name',
      key: 'name',
      width: 280,
      render: (name: string, record) => (
        <Space>
          <span style={{ color: resourceTypeMap[record.type].color }}>
            {resourceTypeMap[record.type].icon}
          </span>
          <span>{name}</span>
        </Space>
      ),
    },
    {
      title: '请求地址',
      dataIndex: 'path',
      key: 'path',
      width: 200,
      render: (path?: string) => path || '-',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      align: 'center',
      render: (type: ResourceType) => (
        <Tag color={resourceTypeMap[type].color}>
          {resourceTypeMap[type].label}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      align: 'center',
      render: (status: OrgNodeStatus) => (
        <Tag color={statusTagMap[status].color}>
          {statusTagMap[status].text}
        </Tag>
      ),
    },
    {
      title: '权限标识',
      dataIndex: 'code',
      key: 'code',
      width: 180,
      render: (code: string) => code || '-',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 80,
      align: 'center',
    },
    {
      title: '操作',
      key: 'actions',
      width: 240,
      fixed: 'right',
      render: (_: any, record: Resource) => {
        if (record.status === 'DELETED') {
          return (
            <Space size={4}>
              <Button
                type="link"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleRestore(record)}
              >
                恢复
              </Button>
            </Space>
          );
        }
        return (
          <Space size={4}>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
            {(record.type === 'CATALOG' || record.type === 'MENU') && (
              <Button
                type="link"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => handleAdd(record.id)}
              >
                新增
              </Button>
            )}
            {record.status === 'ACTIVE' ? (
              <Button
                type="link"
                size="small"
                danger
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
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            >
              删除
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <PageContainer title="资源管理" subTitle="管理系统资源（目录、菜单、按钮）">
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col span={8}>
              <Input
                placeholder="资源名称"
                prefix={<SearchOutlined />}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                allowClear
              />
            </Col>
            <Col span={6}>
              <Select
                placeholder="资源状态"
                value={statusFilter || undefined}
                onChange={(v) => setStatusFilter(v || '')}
                allowClear
                style={{ width: '100%' }}
              >
                <Option value="ACTIVE">正常</Option>
                <Option value="INACTIVE">停用</Option>
                <Option value="DELETED">已删除</Option>
              </Select>
            </Col>
            <Col span={5}>
              <Space>
                <span style={{ color: '#666' }}>展示已删除记录</span>
                <Switch checked={showDeleted} onChange={setShowDeleted} />
              </Space>
            </Col>
            <Col span={5} style={{ textAlign: 'right' }}>
              <Space>
                <Button icon={<SearchOutlined />} type="primary">
                  搜索
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleAdd()}
            >
              新增
            </Button>
            <Button
              icon={<ExpandAltOutlined />}
              onClick={handleExpandAll}
            >
              展开/折叠
            </Button>
          </Space>
          <Space>
            <Button
              icon={<ExpandAltOutlined />}
              size="small"
              onClick={handleExpandAll}
            >
              展开全部
            </Button>
            <Button
              icon={<ShrinkOutlined />}
              size="small"
              onClick={handleCollapseAll}
            >
              收起全部
            </Button>
          </Space>
        </div>

        <Table<Resource>
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          size="small"
          pagination={false}
          expandable={{
            defaultExpandAllRows: true,
            expandedRowKeys,
            onExpandedRowsChange: (keys) => setExpandedRowKeys(keys as React.Key[]),
          }}
          scroll={{ x: 1200, y: 'calc(100vh - 320px)' }}
        />
      </Card>

      <Modal
        title={modalType === 'add' ? '新增资源' : '编辑资源'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        okText="确定"
        cancelText="取消"
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="上级资源"
            name="parentId"
          >
            <TreeSelect
              placeholder="请选择上级资源（不选则为根节点）"
              treeData={treeSelectData}
              treeDefaultExpandAll
              allowClear
              disabled={modalType === 'edit'}
              fieldNames={{ value: 'value' }}
            />
          </Form.Item>

          <Form.Item
            label="资源类型"
            name="type"
            rules={[{ required: true, message: '请选择资源类型' }]}
          >
            <Radio.Group disabled={modalType === 'edit'}>
              <Radio value="CATALOG">
                <FolderOutlined /> 目录
              </Radio>
              <Radio value="MENU">
                <MenuOutlined /> 菜单
              </Radio>
              <Radio value="BUTTON">
                <BgColorsOutlined /> 按钮
              </Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="资源名称"
            name="name"
            rules={[
              { required: true, message: '请输入资源名称' },
              { max: 50, message: '名称长度不能超过50个字符' },
            ]}
          >
            <Input placeholder="请输入资源名称" />
          </Form.Item>

          <Form.Item
            label="显示排序"
            name="sort"
            rules={[{ required: true, message: '请输入排序值' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="请求地址"
            name="path"
          >
            <Input placeholder="请输入请求地址" />
          </Form.Item>

          <Form.Item
            label="图标"
            name="icon"
          >
            <Input placeholder="请输入图标名称（可选）" prefix={<AppstoreOutlined />} />
          </Form.Item>

          <Form.Item label="资源状态" name="visible" valuePropName="checked">
            <Switch
              checkedChildren={<><EyeOutlined /> 显示</>}
              unCheckedChildren={<><EyeInvisibleOutlined /> 隐藏</>}
              defaultChecked
            />
          </Form.Item>

          <Form.Item
            label="权限标识"
            name="permissionCode"
          >
            <Input placeholder="权限编码（自动生成）" disabled />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}
