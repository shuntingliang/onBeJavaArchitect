import React, { useState, useMemo, useCallback } from 'react';
import {
  Input,
  Card,
  Button,
  Space,
  Table,
  Modal,
  Form,
  Select,
  Tag,
  Drawer,
  message,
  Typography,
  Radio,
  Descriptions,
  Tree,
  Divider,
  Dropdown,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
  HistoryOutlined,
  StopOutlined,
  PlayCircleOutlined,
  RollbackOutlined,
  CopyOutlined,
  SafetyOutlined,
  DatabaseOutlined,
  ApartmentOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import PageContainer from '@/components/PageContainer';
import StatusTag from '@/components/StatusTag';
import { useTemplateStore } from '@/store/templateStore';
import { formatDateTime } from '@/utils/dateUtils';
import type { Template, TemplateStatus, Resource, OrgNode, DataPermissionConfig } from '@/types';
import { resources as resourceData } from '@/mock/resourceData';
import { orgNodes as orgData } from '@/mock/orgData';

const { Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;
const { TreeNode } = Tree;

const STATUS_OPTIONS = [
  { label: '全部', value: 'ALL' },
  { label: '草稿', value: 'DRAFT' },
  { label: '已发布', value: 'PUBLISHED' },
  { label: '已停用', value: 'INACTIVE' },
  { label: '已删除', value: 'DELETED' },
];

const DATA_SCOPE_OPTIONS = [
  { label: '本机构', value: 'ORG' },
  { label: '本部门', value: 'DEPT' },
  { label: '本部门及下级', value: 'DEPT_AND_CHILD' },
  { label: '指定部门', value: 'CUSTOM' },
  { label: '本人', value: 'SELF' },
];

const getStatusTagType = (status: TemplateStatus): 'draft' | 'published' | 'inactive' | 'disabled' => {
  switch (status) {
    case 'DRAFT':
      return 'draft';
    case 'PUBLISHED':
      return 'published';
    case 'INACTIVE':
      return 'inactive';
    case 'DELETED':
      return 'disabled';
    default:
      return 'draft';
  }
};

const getStatusText = (status: TemplateStatus): string => {
  switch (status) {
    case 'DRAFT':
      return '草稿';
    case 'PUBLISHED':
      return '已发布';
    case 'INACTIVE':
      return '已停用';
    case 'DELETED':
      return '已删除';
    default:
      return status;
  }
};

const getDataScopeText = (scope: string): string => {
  const option = DATA_SCOPE_OPTIONS.find((opt) => opt.value === scope);
  return option?.label || scope;
};

interface ResourceTreeNode {
  key: string;
  title: React.ReactNode;
  children?: ResourceTreeNode[];
}

interface OrgTreeNode {
  key: string;
  title: string;
  children?: OrgTreeNode[];
}

export default function FunctionSetTemplate() {
  const {
    templates,
    getTemplatesByType,
    getTemplateById,
    getVersions,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    publishTemplate,
    deactivateTemplate,
    createNewVersion,
    searchTemplates,
  } = useTemplateStore();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [functionPermissionDrawerOpen, setFunctionPermissionDrawerOpen] = useState(false);
  const [dataPermissionDrawerOpen, setDataPermissionDrawerOpen] = useState(false);

  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [viewingVersion, setViewingVersion] = useState<Template | null>(null);
  const [configTemplate, setConfigTemplate] = useState<Template | null>(null);

  const [checkedResourceKeys, setCheckedResourceKeys] = useState<string[]>([]);
  const [expandedResourceKeys, setExpandedResourceKeys] = useState<string[]>([]);
  const [dataScope, setDataScope] = useState<string>('SELF');
  const [selectedDeptKeys, setSelectedDeptKeys] = useState<string[]>([]);
  const [expandedOrgKeys, setExpandedOrgKeys] = useState<string[]>([]);

  const [form] = Form.useForm();

  const fsTemplates = useMemo(() => {
    return getTemplatesByType('FUNCTION_SET');
  }, [getTemplatesByType]);

  const latestVersions = useMemo(() => {
    const codeMap = new Map<string, Template>();
    fsTemplates.forEach((t) => {
      const existing = codeMap.get(t.code);
      if (!existing || t.versionNo > existing.versionNo) {
        codeMap.set(t.code, t);
      }
    });
    return Array.from(codeMap.values());
  }, [fsTemplates]);

  const filteredTemplates = useMemo(() => {
    let result = latestVersions;

    if (statusFilter !== 'ALL') {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(kw) ||
          t.code.toLowerCase().includes(kw)
      );
    }

    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [latestVersions, statusFilter, searchKeyword]);

  const templateVersions = useMemo(() => {
    if (!currentTemplate) return [];
    return getVersions(currentTemplate.code);
  }, [currentTemplate, getVersions]);

  const menuResources = useMemo(() => {
    return resourceData.filter((r) => r.parentId === null && r.status === 'ACTIVE');
  }, []);

  const activeOrgNodes = useMemo(() => {
    return orgData.filter((n) => n.status === 'ACTIVE');
  }, []);

  const buildResourceTreeData = useCallback((resources: Resource[]): ResourceTreeNode[] => {
    return resources
      .filter((r) => r.status === 'ACTIVE')
      .sort((a, b) => a.sort - b.sort)
      .map((resource) => {
        const children = resource.children ? buildResourceTreeData(resource.children) : [];
        return {
          key: resource.id,
          title: (
            <span>
              {resource.name}
              <Tag color="blue" style={{ marginLeft: 8, fontSize: 10 }}>
                {resource.type}
              </Tag>
            </span>
          ),
          children: children.length > 0 ? children : undefined,
        };
      });
  }, []);

  const resourceTreeData = useMemo(() => {
    return buildResourceTreeData(menuResources);
  }, [menuResources, buildResourceTreeData]);

  const buildOrgTreeData = useCallback((parentId: string | null): OrgTreeNode[] => {
    const children = activeOrgNodes
      .filter((n) => n.parentId === parentId)
      .sort((a, b) => a.sort - b.sort);
    return children.map((node) => ({
      key: node.id,
      title: node.name,
      children: buildOrgTreeData(node.id),
    }));
  }, [activeOrgNodes]);

  const orgTreeData = useMemo(() => {
    return buildOrgTreeData(null);
  }, [buildOrgTreeData]);

  const getResourceIdsFromTemplate = (template: Template): string[] => {
    try {
      if (template.content) {
        const parsed = JSON.parse(template.content);
        return parsed.resourceIds || [];
      }
    } catch {
      // ignore
    }
    return [];
  };

  const getDataPermissionFromTemplate = (template: Template): DataPermissionConfig => {
    try {
      if (template.content) {
        const parsed = JSON.parse(template.content);
        return parsed.dataPermission || { scope: 'SELF', deptIds: [] };
      }
    } catch {
      // ignore
    }
    return { scope: 'SELF', deptIds: [] };
  };

  const generateTemplateCode = useCallback(() => {
    const fsTpls = templates.filter((t) => t.type === 'FUNCTION_SET');
    const maxNum = fsTpls.reduce((max, t) => {
      const match = t.code.match(/TPL_FS_(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    return `TPL_FS_${String(maxNum + 1).padStart(3, '0')}`;
  }, [templates]);

  const openCreateModal = () => {
    form.resetFields();
    form.setFieldsValue({
      name: '',
      code: generateTemplateCode(),
      description: '',
      status: 'DRAFT',
    });
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async () => {
    try {
      const values = await form.validateFields();
      addTemplate({
        code: values.code,
        name: values.name,
        version: 'v1.0.0',
        status: 'DRAFT',
        type: 'FUNCTION_SET',
        content: values.description,
      });
      message.success('创建成功');
      setCreateModalOpen(false);
    } catch {
      // 表单验证失败
    }
  };

  const openEditModal = (template: Template) => {
    setEditingTemplate(template);
    form.resetFields();
    form.setFieldsValue({
      name: template.name,
      code: template.code,
      description: template.content || '',
      status: template.status,
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingTemplate) {
        if (editingTemplate.status === 'PUBLISHED') {
          const newVersionNo = editingTemplate.versionNo + 1;
          createNewVersion(
            editingTemplate.id,
            `v${newVersionNo}.0.0`,
            values.description
          );
          message.success('已创建新版本，状态为草稿');
        } else {
          updateTemplate(editingTemplate.id, {
            name: values.name,
            code: values.code || editingTemplate.code,
            content: values.description,
          });
          message.success('更新成功');
        }
        setEditModalOpen(false);
      }
    } catch {
      // 表单验证失败
    }
  };

  const handlePublish = (template: Template) => {
    Modal.confirm({
      title: '确认发布',
      content: `确定要发布「${template.name}」吗？发布后状态将变为已发布。`,
      okText: '确认发布',
      onOk: () => {
        publishTemplate(template.id);
        message.success('发布成功');
      },
    });
  };

  const handleDeactivate = (template: Template) => {
    Modal.confirm({
      title: '确认停用',
      content: `确定要停用「${template.name}」吗？停用后该模板将不可用。`,
      okText: '确认停用',
      okButtonProps: { danger: true },
      onOk: () => {
        deactivateTemplate(template.id);
        message.success('停用成功');
      },
    });
  };

  const handleActivate = (template: Template) => {
    Modal.confirm({
      title: '确认启用',
      content: `确定要启用「${template.name}」吗？`,
      okText: '确认启用',
      onOk: () => {
        publishTemplate(template.id);
        message.success('启用成功');
      },
    });
  };

  const handleDelete = (template: Template) => {
    const versions = getVersions(template.code);
    const versionCount = versions.length;
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除「${template.name}」吗？该模板共有 ${versionCount} 个版本，将一并删除。`,
      okText: '确认删除',
      okButtonProps: { danger: true },
      onOk: () => {
        versions.forEach((v) => {
          deleteTemplate(v.id);
        });
        message.success('删除成功');
      },
    });
  };

  const handleRestore = (template: Template) => {
    const versions = getVersions(template.code);
    const deletedVersions = versions.filter((v) => v.status === 'DELETED');
    const versionCount = deletedVersions.length;
    Modal.confirm({
      title: '确认恢复',
      content: `确定要恢复「${template.name}」吗？将恢复 ${versionCount} 个已删除版本，状态重置为草稿。`,
      okText: '确认恢复',
      onOk: () => {
        deletedVersions.forEach((v) => {
          updateTemplate(v.id, { status: 'DRAFT' });
        });
        message.success('恢复成功');
      },
    });
  };

  const openVersionDrawer = (template: Template) => {
    setCurrentTemplate(template);
    setVersionDrawerOpen(true);
  };

  const openDetailDrawer = (template: Template) => {
    setViewingVersion(template);
    setDetailDrawerOpen(true);
  };

  const handleSwitchVersion = (version: Template) => {
    Modal.confirm({
      title: '切换版本',
      content: `确定要将「${currentTemplate?.name}」切换到版本 ${version.version} 吗？将创建新版本并设为当前版本。`,
      okText: '确认切换',
      onOk: () => {
        const newVersionNo = (currentTemplate?.versionNo || 0) + 1;
        createNewVersion(
          version.id,
          `v${newVersionNo}.0.0`,
          version.content
        );
        message.success('版本切换成功，已创建新版本');
        setVersionDrawerOpen(false);
      },
    });
  };

  const openFunctionPermissionDrawer = (template: Template) => {
    setConfigTemplate(template);
    const resourceIds = getResourceIdsFromTemplate(template);
    setCheckedResourceKeys(resourceIds);
    setExpandedResourceKeys(menuResources.map((r) => r.id));
    setFunctionPermissionDrawerOpen(true);
  };

  const handleFunctionPermissionSave = () => {
    if (configTemplate) {
      try {
        let content: any = {};
        if (configTemplate.content) {
          try {
            content = JSON.parse(configTemplate.content);
          } catch {
            content = {};
          }
        }
        content.resourceIds = checkedResourceKeys;

        if (configTemplate.status === 'PUBLISHED') {
          const newVersionNo = configTemplate.versionNo + 1;
          createNewVersion(
            configTemplate.id,
            `v${newVersionNo}.0.0`,
            JSON.stringify(content)
          );
          message.success('保存成功，已创建新版本');
        } else {
          updateTemplate(configTemplate.id, {
            content: JSON.stringify(content),
          });
          message.success('保存成功');
        }
        setFunctionPermissionDrawerOpen(false);
      } catch {
        message.error('保存失败');
      }
    }
  };

  const openDataPermissionDrawer = (template: Template) => {
    setConfigTemplate(template);
    const dataPermission = getDataPermissionFromTemplate(template);
    setDataScope(dataPermission.scope);
    setSelectedDeptKeys(dataPermission.deptIds);
    setExpandedOrgKeys(activeOrgNodes.filter((n) => n.parentId === null).map((n) => n.id));
    setDataPermissionDrawerOpen(true);
  };

  const handleDataPermissionSave = () => {
    if (configTemplate) {
      try {
        let content: any = {};
        if (configTemplate.content) {
          try {
            content = JSON.parse(configTemplate.content);
          } catch {
            content = {};
          }
        }
        content.dataPermission = {
          scope: dataScope,
          deptIds: dataScope === 'CUSTOM' ? selectedDeptKeys : [],
        };

        if (configTemplate.status === 'PUBLISHED') {
          const newVersionNo = configTemplate.versionNo + 1;
          createNewVersion(
            configTemplate.id,
            `v${newVersionNo}.0.0`,
            JSON.stringify(content)
          );
          message.success('保存成功，已创建新版本');
        } else {
          updateTemplate(configTemplate.id, {
            content: JSON.stringify(content),
          });
          message.success('保存成功');
        }
        setDataPermissionDrawerOpen(false);
      } catch {
        message.error('保存失败');
      }
    }
  };

  const onResourceCheck = (checkedKeys: any) => {
    const keys = checkedKeys.checked || checkedKeys;
    setCheckedResourceKeys(Array.isArray(keys) ? keys.map((k: React.Key) => String(k)) : []);
  };

  const onResourceExpand = (expandedKeys: React.Key[]) => {
    setExpandedResourceKeys(expandedKeys.map((k) => String(k)));
  };

  const onOrgSelect = (selectedKeys: React.Key[]) => {
    setSelectedDeptKeys(selectedKeys.map((k) => String(k)));
  };

  const onOrgExpand = (expandedKeys: React.Key[]) => {
    setExpandedOrgKeys(expandedKeys.map((k) => String(k)));
  };

  const tableColumns = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
      render: (text: string, record: Template) => (
        <Space>
          <span style={{ fontWeight: 500 }}>{text}</span>
          <Tag color="blue">{record.version}</Tag>
        </Space>
      ),
    },
    {
      title: '模板编码',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TemplateStatus) => (
        <StatusTag status={getStatusTagType(status)} text={getStatusText(status)} />
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record: Template) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetailDrawer(record)}>
            查看
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} disabled={record.status === 'DELETED'}>
            编辑
          </Button>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'version',
                  icon: <HistoryOutlined />,
                  label: '版本记录',
                  onClick: () => openVersionDrawer(record),
                },
                {
                  key: 'functionPermission',
                  icon: <SafetyOutlined />,
                  label: '功能权限',
                  onClick: () => openFunctionPermissionDrawer(record),
                  disabled: record.status === 'DELETED',
                },
                {
                  key: 'dataPermission',
                  icon: <DatabaseOutlined />,
                  label: '数据权限',
                  onClick: () => openDataPermissionDrawer(record),
                  disabled: record.status === 'DELETED',
                },
                ...(record.status === 'DRAFT'
                  ? [
                      {
                        key: 'publish',
                        icon: <PlayCircleOutlined />,
                        label: '发布版本',
                        onClick: () => handlePublish(record),
                      },
                    ]
                  : []),
                ...(record.status === 'PUBLISHED'
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
                ...(record.status !== 'DELETED'
                  ? [
                      {
                        key: 'delete',
                        icon: <DeleteOutlined />,
                        label: '删除',
                        danger: true,
                        onClick: () => handleDelete(record),
                      },
                    ]
                  : [
                      {
                        key: 'restore',
                        icon: <RollbackOutlined />,
                        label: '恢复',
                        onClick: () => handleRestore(record),
                      },
                    ]),
              ],
            }}
          >
            <Button type="link" size="small" icon={<MoreOutlined />}>
              更多
            </Button>
          </Dropdown>
        </Space>
      ),
    },
  ];

  const renderResourceTreeNodes = (data: ResourceTreeNode[]): React.ReactNode =>
    data.map((item) => {
      if (item.children && item.children.length > 0) {
        return (
          <TreeNode key={item.key} title={item.title}>
            {renderResourceTreeNodes(item.children)}
          </TreeNode>
        );
      }
      return <TreeNode key={item.key} title={item.title} />;
    });

  const renderOrgTreeNodes = (data: OrgTreeNode[]): React.ReactNode =>
    data.map((item) => {
      if (item.children && item.children.length > 0) {
        return (
          <TreeNode key={item.key} title={item.title} icon={<ApartmentOutlined />}>
            {renderOrgTreeNodes(item.children)}
          </TreeNode>
        );
      }
      return <TreeNode key={item.key} title={item.title} icon={<ApartmentOutlined />} />;
    });

  return (
    <PageContainer title="职能集模板" subTitle="管理职能集模板及其权限配置">
      {/* 顶部操作栏 */}
      <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Space wrap>
            <Search
              placeholder="搜索模板名称/编码"
              allowClear
              style={{ width: 280 }}
              onSearch={(value) => {
                setSearchKeyword(value);
                setCurrentPage(1);
              }}
              onChange={(e) => {
                if (!e.target.value) {
                  setSearchKeyword('');
                  setCurrentPage(1);
                }
              }}
            />
            <Select
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
              style={{ width: 140 }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新建模板
          </Button>
        </div>
      </Card>

      {/* 模板列表 */}
      <Card bodyStyle={{ padding: 0 }}>
        <Table
          dataSource={filteredTemplates}
          columns={tableColumns}
          rowKey="id"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredTemplates.length,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => `共 ${total} 个模板`,
          }}
        />
      </Card>

      {/* 新建模板模态框 */}
      <Modal
        title="新建职能集模板"
        open={createModalOpen}
        onOk={handleCreateSubmit}
        onCancel={() => setCreateModalOpen(false)}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="模板名称"
            name="name"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="请输入模板名称" maxLength={50} showCount />
          </Form.Item>
          <Form.Item label="模板编码" name="code">
            <Input placeholder="请输入模板编码（可留空自动生成）" allowClear />
          </Form.Item>
          <Form.Item label="模板描述" name="description">
            <TextArea rows={4} placeholder="请输入模板描述" maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑模板模态框 */}
      <Modal
        title="编辑职能集模板"
        open={editModalOpen}
        onOk={handleEditSubmit}
        onCancel={() => setEditModalOpen(false)}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="模板名称"
            name="name"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="请输入模板名称" maxLength={50} showCount />
          </Form.Item>
          <Form.Item label="模板编码" name="code">
            <Input placeholder="请输入模板编码（可留空自动生成）" allowClear />
          </Form.Item>
          {editingTemplate?.status === 'PUBLISHED' && (
            <div style={{ marginBottom: 16, padding: 12, background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 4 }}>
              <Text type="warning">
                <strong>提示：</strong>已发布的模板编辑后将创建新版本，状态为草稿，需重新发布后生效。
              </Text>
            </div>
          )}
          <Form.Item label="模板描述" name="description">
            <TextArea rows={4} placeholder="请输入模板描述" maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>

      {/* 功能权限配置抽屉 */}
      <Drawer
        title="功能权限配置"
        placement="right"
        width={560}
        open={functionPermissionDrawerOpen}
        onClose={() => setFunctionPermissionDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setFunctionPermissionDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleFunctionPermissionSave}>保存</Button>
          </Space>
        }
      >
        {configTemplate && (
          <>
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <Space>
                <span style={{ fontWeight: 500 }}>{configTemplate.name}</span>
                <Text type="secondary">{configTemplate.code}</Text>
              </Space>
            </div>
            {configTemplate.status === 'PUBLISHED' && (
              <div style={{ marginBottom: 16, padding: 12, background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 4 }}>
                <Text type="warning">
                  <strong>提示：</strong>已发布的模板修改后将创建新版本，状态为草稿，需重新发布后生效。
                </Text>
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary">已选 {checkedResourceKeys.length} 项权限</Text>
            </div>
            <Card bodyStyle={{ padding: 12 }} style={{ maxHeight: 'calc(100vh - 280px)', overflow: 'auto' }}>
              <Tree
                checkable
                expandedKeys={expandedResourceKeys}
                checkedKeys={checkedResourceKeys}
                onExpand={onResourceExpand}
                onCheck={onResourceCheck}
                defaultExpandAll={false}
              >
                {renderResourceTreeNodes(resourceTreeData)}
              </Tree>
            </Card>
          </>
        )}
      </Drawer>

      {/* 数据权限配置抽屉 */}
      <Drawer
        title="数据权限配置"
        placement="right"
        width={560}
        open={dataPermissionDrawerOpen}
        onClose={() => setDataPermissionDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setDataPermissionDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleDataPermissionSave}>保存</Button>
          </Space>
        }
      >
        {configTemplate && (
          <>
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <Space>
                <span style={{ fontWeight: 500 }}>{configTemplate.name}</span>
                <Text type="secondary">{configTemplate.code}</Text>
              </Space>
            </div>
            {configTemplate.status === 'PUBLISHED' && (
              <div style={{ marginBottom: 16, padding: 12, background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 4 }}>
                <Text type="warning">
                  <strong>提示：</strong>已发布的模板修改后将创建新版本，状态为草稿，需重新发布后生效。
                </Text>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>数据权限范围</div>
              <Radio.Group
                value={dataScope}
                onChange={(e) => setDataScope(e.target.value)}
                style={{ width: '100%' }}
              >
                <Space direction="vertical">
                  {DATA_SCOPE_OPTIONS.map((opt) => (
                    <Radio key={opt.value} value={opt.value}>
                      {opt.label}
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </div>

            {dataScope === 'CUSTOM' && (
              <>
                <Divider style={{ margin: '16px 0' }} />
                <div style={{ marginBottom: 12 }}>
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>选择部门</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>已选 {selectedDeptKeys.length} 个部门</Text>
                </div>
                <Card bodyStyle={{ padding: 12 }} style={{ maxHeight: 400, overflow: 'auto' }}>
                  <Tree
                    multiple
                    checkable
                    expandedKeys={expandedOrgKeys}
                    selectedKeys={selectedDeptKeys}
                    checkedKeys={selectedDeptKeys}
                    onExpand={onOrgExpand}
                    onSelect={onOrgSelect}
                    onCheck={(checkedKeys: any) => {
                      const keys = checkedKeys.checked || checkedKeys;
                      setSelectedDeptKeys(Array.isArray(keys) ? keys.map((k: React.Key) => String(k)) : []);
                    }}
                    defaultExpandAll={false}
                  >
                    {renderOrgTreeNodes(orgTreeData)}
                  </Tree>
                </Card>
              </>
            )}
          </>
        )}
      </Drawer>

      {/* 版本历史抽屉 */}
      <Drawer
        title="版本历史"
        placement="right"
        width={640}
        open={versionDrawerOpen}
        onClose={() => setVersionDrawerOpen(false)}
        extra={
          <Space>
            <Text type="secondary">
              共 {templateVersions.length} 个版本
            </Text>
          </Space>
        }
      >
        {currentTemplate && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
            <Space>
              <span style={{ fontWeight: 500 }}>{currentTemplate.name}</span>
              <Text type="secondary">{currentTemplate.code}</Text>
            </Space>
          </div>
        )}
        <Table
          dataSource={templateVersions}
          rowKey="id"
          size="middle"
          pagination={false}
          columns={[
            {
              title: '版本号',
              dataIndex: 'version',
              key: 'version',
              width: 120,
              render: (text: string, record: Template) => (
                <Space>
                  <Tag color="blue">{text}</Tag>
                  {currentTemplate?.id === record.id && <Tag color="green">当前</Tag>}
                </Space>
              ),
            },
            {
              title: '状态',
              dataIndex: 'status',
              key: 'status',
              width: 100,
              render: (status: TemplateStatus) => (
                <StatusTag status={getStatusTagType(status)} text={getStatusText(status)} />
              ),
            },
            {
              title: '创建时间',
              dataIndex: 'createdAt',
              key: 'createdAt',
              render: (date: string) => formatDateTime(date),
            },
            {
              title: '操作',
              key: 'action',
              width: 150,
              render: (_, record: Template) => (
                <Space size="small">
                  <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetailDrawer(record)}>
                    查看
                  </Button>
                  {currentTemplate?.id !== record.id && (
                    <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => handleSwitchVersion(record)}>
                      切换
                    </Button>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Drawer>

      {/* 模板详情抽屉 */}
      <Drawer
        title="模板详情"
        placement="right"
        width={560}
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
      >
        {viewingVersion && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="模板名称">{viewingVersion.name}</Descriptions.Item>
            <Descriptions.Item label="模板编码">{viewingVersion.code}</Descriptions.Item>
            <Descriptions.Item label="版本号">{viewingVersion.version}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <StatusTag status={getStatusTagType(viewingVersion.status)} text={getStatusText(viewingVersion.status)} />
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{formatDateTime(viewingVersion.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{formatDateTime(viewingVersion.updatedAt)}</Descriptions.Item>
            <Descriptions.Item label="功能权限数量">
              {getResourceIdsFromTemplate(viewingVersion).length} 个
            </Descriptions.Item>
            <Descriptions.Item label="数据权限范围">
              {getDataScopeText(getDataPermissionFromTemplate(viewingVersion).scope)}
            </Descriptions.Item>
            <Descriptions.Item label="模板描述">
              <div style={{ whiteSpace: 'pre-wrap' }}>{viewingVersion.content || '暂无描述'}</div>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </PageContainer>
  );
}
