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
  Empty,
  Typography,
  Row,
  Col,
  Pagination,
  Radio,
  Tooltip,
  Descriptions,
  Divider,
  Dropdown,
  theme,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
  HistoryOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  StopOutlined,
  PlayCircleOutlined,
  RollbackOutlined,
  MoreOutlined,
  CaretRightOutlined,
  CaretDownOutlined,
  ApartmentOutlined,
  BankOutlined,
  TeamOutlined,
  ProjectOutlined,
  FlagOutlined,
  FolderOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import PageContainer from '@/components/PageContainer';
import StatusTag from '@/components/StatusTag';
import { useTemplateStore } from '@/store/templateStore';
import { formatDateTime, getNow } from '@/utils/dateUtils';
import { generateUUID } from '@/utils/idGenerator';
import type { Template, TemplateStatus, TemplateMode, TemplateNode } from '@/types';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

const TEMPLATE_MODE_OPTIONS = [
  { label: '职能型', value: 'VERTICAL' as TemplateMode },
  { label: '项目型', value: 'HORIZONTAL' as TemplateMode },
];

const ORG_SCALE_OPTIONS = [
  { label: '50人以下', value: '50以下' },
  { label: '50-100人', value: '50-100' },
  { label: '100-200人', value: '100-200' },
  { label: '200-500人', value: '200-500' },
  { label: '500-1000人', value: '500-1000' },
  { label: '1000人以上', value: '1000+' },
];

// 职能型节点类型选项（集团、分公司、部门）
const VERTICAL_NODE_TYPE_OPTIONS = [
  { label: '集团', value: 'GROUP' },
  { label: '分公司', value: 'COMPANY' },
  { label: '部门', value: 'DEPARTMENT' },
];

// 项目型节点类型选项（项目集、项目）
const HORIZONTAL_NODE_TYPE_OPTIONS = [
  { label: '项目集', value: 'PROGRAM' },
  { label: '项目', value: 'PROJECT' },
];

const NODE_TYPE_OPTIONS = [
  ...VERTICAL_NODE_TYPE_OPTIONS,
  ...HORIZONTAL_NODE_TYPE_OPTIONS,
];

const getNodeTypeOptionsByMode = (mode: TemplateMode | undefined) => {
  if (mode === 'HORIZONTAL') {
    return HORIZONTAL_NODE_TYPE_OPTIONS;
  }
  return VERTICAL_NODE_TYPE_OPTIONS;
};

const NODE_NAME_OPTIONS = [
  '集团总部',
  '分公司',
  '技术中心',
  '研发中心',
  '产品部',
  '运营部',
  '市场部',
  '销售部',
  '人事部',
  '财务部',
  '行政部',
  '后端组',
  '前端组',
  '测试组',
  '运维组',
  '数据分析组',
  '项目管理组',
];

const NODE_TYPE_ICON_MAP: Record<string, React.ReactNode> = {
  GROUP: <ApartmentOutlined />,
  COMPANY: <BankOutlined />,
  DEPARTMENT: <TeamOutlined />,
  PROGRAM: <FlagOutlined />,
  PROJECT: <ProjectOutlined />,
};

const NODE_TYPE_COLOR_MAP: Record<string, string> = {
  GROUP: 'magenta',
  COMPANY: 'blue',
  DEPARTMENT: 'green',
  PROGRAM: 'orange',
  PROJECT: 'purple',
};

const STATUS_OPTIONS = [
  { label: '全部', value: 'ALL' },
  { label: '草稿', value: 'DRAFT' },
  { label: '已发布', value: 'PUBLISHED' },
  { label: '已停用', value: 'INACTIVE' },
  { label: '已删除', value: 'DELETED' },
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

export default function OrganizationTemplate() {
  const { token } = theme.useToken();
  const allTemplates = useTemplateStore((state) => state.templates);
  const addTemplate = useTemplateStore((state) => state.addTemplate);
  const updateTemplate = useTemplateStore((state) => state.updateTemplate);
  const deleteTemplate = useTemplateStore((state) => state.deleteTemplate);
  const publishTemplate = useTemplateStore((state) => state.publishTemplate);
  const deactivateTemplate = useTemplateStore((state) => state.deactivateTemplate);
  const createNewVersion = useTemplateStore((state) => state.createNewVersion);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [viewingVersion, setViewingVersion] = useState<Template | null>(null);

  const [form] = Form.useForm();
  const [templateNodes, setTemplateNodes] = useState<TemplateNode[]>([]);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());

  const orgTemplates = useMemo(() => {
    return allTemplates.filter((t) => t.type === 'ORG');
  }, [allTemplates]);

  const latestVersions = useMemo(() => {
    const codeMap = new Map<string, Template>();
    orgTemplates.forEach((t) => {
      const existing = codeMap.get(t.code);
      if (!existing || t.versionNo > existing.versionNo) {
        codeMap.set(t.code, t);
      }
    });
    return Array.from(codeMap.values());
  }, [orgTemplates]);

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

  const paginatedTemplates = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTemplates.slice(start, start + pageSize);
  }, [filteredTemplates, currentPage, pageSize]);

  const templateVersions = useMemo(() => {
    if (!currentTemplate) return [];
    return allTemplates
      .filter((t) => t.code === currentTemplate.code)
      .sort((a, b) => b.versionNo - a.versionNo);
  }, [currentTemplate, allTemplates]);

  const generateTemplateCode = useCallback(() => {
    const orgTpls = allTemplates.filter((t) => t.type === 'ORG');
    const maxNum = orgTpls.reduce((max, t) => {
      const match = t.code.match(/TPL_ORG_(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    return `TPL_ORG_${String(maxNum + 1).padStart(3, '0')}`;
  }, [allTemplates]);

  const buildTreeData = useCallback((nodes: TemplateNode[]) => {
    const nodeMap = new Map<string, any>();
    const roots: any[] = [];
    const sorted = [...nodes].sort((a, b) => a.sort - b.sort);
    sorted.forEach((node) => {
      nodeMap.set(node.nodeName, { ...node, key: node.id, children: [] });
    });
    sorted.forEach((node) => {
      const treeNode = nodeMap.get(node.nodeName);
      if (node.parentNodeName && nodeMap.has(node.parentNodeName)) {
        nodeMap.get(node.parentNodeName)!.children.push(treeNode);
      } else {
        roots.push(treeNode);
      }
    });
    return roots;
  }, []);

  const toggleNodeExpand = (nodeId: string) => {
    setExpandedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const expandAllNodes = (nodes: any[]) => {
    const ids = new Set<string>();
    const collect = (list: any[]) => {
      list.forEach((n) => {
        if (n.children && n.children.length > 0) {
          ids.add(n.id);
          collect(n.children);
        }
      });
    };
    collect(nodes);
    setExpandedNodeIds(ids);
  };

  const addTemplateNode = (parentNodeName: string = '') => {
    setTemplateNodes((prev) => [
      ...prev,
      {
        id: generateUUID(),
        parentNodeName,
        nodeName: '',
        nodeCode: '',
        nodeType: 'DEPARTMENT',
        sort: prev.length + 1,
      },
    ]);
  };

  const addChildNode = (parentNodeName: string) => {
    addTemplateNode(parentNodeName);
  };

  const getParentNodeOptions = (currentNodeId: string, mode: TemplateMode | undefined) => {
    const options: { label: string; value: string }[] = [
      { label: '根节点', value: '' },
    ];
    templateNodes
      .filter((n) => n.id !== currentNodeId && n.nodeName.trim())
      .forEach((n) => {
        options.push({ label: n.nodeName, value: n.nodeName });
      });
    return options;
  };

  const removeTemplateNode = (id: string) => {
    const node = templateNodes.find((n) => n.id === id);
    if (!node) return;
    setTemplateNodes((prev) => {
      const nodeName = node.nodeName;
      const descendantNames = new Set<string>();
      const collectDescendants = (parentName: string) => {
        prev.forEach((n) => {
          if (n.parentNodeName === parentName) {
            descendantNames.add(n.nodeName);
            collectDescendants(n.nodeName);
          }
        });
      };
      if (nodeName) {
        descendantNames.add(nodeName);
        collectDescendants(nodeName);
      }
      const remaining = prev.filter((n) => !descendantNames.has(n.nodeName));
      return remaining.map((n, index) => ({ ...n, sort: index + 1 }));
    });
  };

  const updateTemplateNode = (id: string, field: keyof TemplateNode, value: string | number) => {
    setTemplateNodes((prev) => {
      const oldNode = prev.find((n) => n.id === id);
      if (!oldNode) return prev;
      const oldNodeName = oldNode.nodeName;
      const newNodeName = field === 'nodeName' ? (value as string) : oldNodeName;
      return prev.map((n) => {
        if (n.id === id) {
          return { ...n, [field]: value };
        }
        if (oldNodeName && newNodeName && n.parentNodeName === oldNodeName) {
          return { ...n, parentNodeName: newNodeName };
        }
        return n;
      });
    });
  };

  const openCreateModal = () => {
    form.resetFields();
    form.setFieldsValue({
      name: '',
      code: generateTemplateCode(),
      templateMode: 'VERTICAL',
      orgScale: '',
      remark: '',
    });
    const initialNodes = [
      {
        id: generateUUID(),
        parentNodeName: '',
        nodeName: '',
        nodeCode: '',
        nodeType: 'GROUP' as const,
        sort: 1,
      },
    ];
    setTemplateNodes(initialNodes);
    setExpandedNodeIds(new Set());
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async () => {
    try {
      const values = await form.validateFields();
      const validNodes = templateNodes.filter((n) => n.nodeName.trim());
      if (validNodes.length === 0) {
        message.warning('请至少填写一条架构节点信息');
        return;
      }
      addTemplate({
        code: values.code,
        name: values.name,
        version: 'v1.0.0',
        status: 'DRAFT',
        type: 'ORG',
        templateMode: values.templateMode,
        orgScale: values.orgScale,
        content: values.remark,
        nodes: validNodes,
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
      templateMode: template.templateMode || 'VERTICAL',
      orgScale: template.orgScale || '',
      remark: template.content || '',
    });
    const nodes = template.nodes || [
      {
        id: generateUUID(),
        parentNodeName: '',
        nodeName: '',
        nodeCode: '',
        nodeType: 'DEPARTMENT' as const,
        sort: 1,
      },
    ];
    setTemplateNodes(nodes);
    const tree = buildTreeData(nodes);
    expandAllNodes(tree);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      const validNodes = templateNodes.filter((n) => n.nodeName.trim());
      if (validNodes.length === 0) {
        message.warning('请至少填写一条架构节点信息');
        return;
      }
      if (editingTemplate) {
        if (editingTemplate.status === 'PUBLISHED') {
          const newVersionNo = editingTemplate.versionNo + 1;
          createNewVersion(
            editingTemplate.id,
            `v${newVersionNo}.0.0`,
            values.remark,
            validNodes
          );
          message.success('已创建新版本，状态为草稿');
        } else {
          updateTemplate(editingTemplate.id, {
            name: values.name,
            templateMode: values.templateMode,
            orgScale: values.orgScale,
            content: values.remark,
            nodes: validNodes,
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
    const versions = allTemplates.filter((t) => t.code === template.code);
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
    const versions = allTemplates.filter((t) => t.code === template.code);
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

  const tableColumns = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
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
      width: 180,
    },
    {
      title: '模版模式',
      dataIndex: 'templateMode',
      key: 'templateMode',
      width: 100,
      render: (mode: TemplateMode) => {
        const option = TEMPLATE_MODE_OPTIONS.find((opt) => opt.value === mode);
        return option ? option.label : '-';
      },
    },
    {
      title: '适用规模',
      dataIndex: 'orgScale',
      key: 'orgScale',
      width: 120,
      render: (scale: string) => {
        const option = ORG_SCALE_OPTIONS.find((opt) => opt.value === scale);
        return option ? option.label : '-';
      },
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

  return (
    <PageContainer title="组织架构模版" subTitle="管理组织架构模版及其版本">
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
            <Radio.Group
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value="card">
                <AppstoreOutlined /> 卡片视图
              </Radio.Button>
              <Radio.Button value="list">
                <UnorderedListOutlined /> 列表视图
              </Radio.Button>
            </Radio.Group>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新建模板
          </Button>
        </div>
      </Card>

      {/* 规则说明 */}
      <div
        style={{
          background: '#e6f4ff',
          border: '1px solid #91caff',
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
        }}
      >
        <Space size="small" wrap>
          <Text strong>规则说明：</Text>
          <Tag color="blue">模版模式：职能型（集团/部门/分公司） · 项目型（项目集/项目）</Tag>
          <Tag color="cyan">节点类型：仅显示当前模版模式支持的类型</Tag>
          <Tag color="green">模版编码：可手动输入，非必填</Tag>
          <Tag color="orange">节点编码：可手动输入，非必填</Tag>
          <Tag color="purple">已发布模版编辑将自动创建新版本</Tag>
        </Space>
      </div>

      {/* 模板列表 */}
      {viewMode === 'card' ? (
        <Card bodyStyle={{ padding: 16 }}>
          {paginatedTemplates.length > 0 ? (
            <>
              <Row gutter={[16, 16]}>
                {paginatedTemplates.map((template) => (
                  <Col xs={24} sm={12} md={8} key={template.id}>
                    <Card
                      hoverable
                      style={{ height: '100%' }}
                      bodyStyle={{ padding: 16, display: 'flex', flexDirection: 'column', height: '100%' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Title level={5} style={{ margin: 0, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {template.name}
                          </Title>
                          <Text type="secondary" style={{ fontSize: 12 }}>{template.code}</Text>
                        </div>
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <Space size={[8, 8]} wrap>
                          <Tag color="blue">{template.version}</Tag>
                          <StatusTag status={getStatusTagType(template.status)} text={getStatusText(template.status)} />
                        </Space>
                      </div>

                      <div
                        style={{
                          flex: 1,
                          marginBottom: 12,
                          color: '#666',
                          fontSize: 13,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          minHeight: 54,
                        }}
                      >
                        {template.content || '暂无描述'}
                      </div>

                      <div style={{ marginBottom: 12, fontSize: 12, color: '#999' }}>
                        更新时间：{formatDateTime(template.updatedAt)}
                      </div>

                      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, marginTop: 'auto' }}>
                        <Space size={[4, 4]} wrap>
                          <Tooltip title="查看详情">
                            <Button
                              type="text"
                              size="small"
                              icon={<EyeOutlined />}
                              onClick={() => openDetailDrawer(template)}
                            />
                          </Tooltip>
                          <Tooltip title="编辑">
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => openEditModal(template)}
                              disabled={template.status === 'DELETED'}
                            />
                          </Tooltip>
                          <Tooltip title="版本历史">
                            <Button
                              type="text"
                              size="small"
                              icon={<HistoryOutlined />}
                              onClick={() => openVersionDrawer(template)}
                            />
                          </Tooltip>
                          {template.status === 'DRAFT' && (
                            <Tooltip title="发布">
                              <Button
                                type="text"
                                size="small"
                                icon={<PlayCircleOutlined />}
                                onClick={() => handlePublish(template)}
                              />
                            </Tooltip>
                          )}
                          {template.status === 'PUBLISHED' && (
                            <Tooltip title="停用">
                              <Button
                                type="text"
                                size="small"
                                danger
                                icon={<StopOutlined />}
                                onClick={() => handleDeactivate(template)}
                              />
                            </Tooltip>
                          )}
                          {template.status === 'INACTIVE' && (
                            <Tooltip title="启用">
                              <Button
                                type="text"
                                size="small"
                                icon={<PlayCircleOutlined />}
                                onClick={() => handleActivate(template)}
                              />
                            </Tooltip>
                          )}
                          {template.status === 'DELETED' ? (
                            <Tooltip title="恢复">
                              <Button
                                type="text"
                                size="small"
                                icon={<RollbackOutlined />}
                                onClick={() => handleRestore(template)}
                              />
                            </Tooltip>
                          ) : (
                            <Tooltip title="删除">
                              <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDelete(template)}
                              />
                            </Tooltip>
                          )}
                        </Space>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={filteredTemplates.length}
                  onChange={(page, size) => {
                    setCurrentPage(page);
                    setPageSize(size);
                  }}
                  showSizeChanger
                  pageSizeOptions={['9', '12', '24', '48']}
                  showTotal={(total) => `共 ${total} 个模板`}
                />
              </div>
            </>
          ) : (
            <Empty description="暂无模板数据" style={{ padding: '60px 0' }} />
          )}
        </Card>
      ) : (
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
              expandedRowRender={(record: Template) => {
                if (!record.nodes || record.nodes.length === 0) {
                  return <div style={{ padding: 16, textAlign: 'center', color: '#999' }}>暂无架构节点</div>;
                }
                const treeData = buildTreeData(record.nodes);

                const renderListNodeRow = (node: any, level: number = 0) => {
                  const hasChildren = node.children && node.children.length > 0;
                  const nodeTypeLabel = NODE_TYPE_OPTIONS.find((o: any) => o.value === node.nodeType)?.label || '-';
                  const nodeTypeColor = NODE_TYPE_COLOR_MAP[node.nodeType] || 'default';
                  const isRoot = level === 0;
                  const indent = level * 24;

                  const row = (
                    <div
                      key={node.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(220px, 1fr) 120px 120px',
                        padding: '10px 12px',
                        alignItems: 'center',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: indent }}>
                        {hasChildren ? (
                          <CaretDownOutlined style={{ fontSize: 12, color: token.colorTextSecondary, width: 16 }} />
                        ) : (
                          <div style={{ width: 16, height: 16 }} />
                        )}
                        {isRoot && <FolderOutlined style={{ color: '#faad14', fontSize: 14 }} />}
                        {!isRoot && <FileTextOutlined style={{ color: '#bfbfbf', fontSize: 14 }} />}
                        <span style={{ fontWeight: isRoot ? 600 : 500 }}>{node.nodeName}</span>
                      </div>
                      <div style={{ paddingLeft: 0 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>{node.nodeCode}</Text>
                      </div>
                      <div>
                        <Tag color={nodeTypeColor} style={{ margin: 0 }}>{nodeTypeLabel}</Tag>
                      </div>
                    </div>
                  );

                  if (hasChildren) {
                    return (
                      <>
                        {row}
                        {node.children.map((child: any) => renderListNodeRow(child, level + 1))}
                      </>
                    );
                  }
                  return row;
                };

                return (
                  <div style={{ padding: '8px 24px 16px' }}>
                    <div
                      style={{
                        border: '1px solid #f0f0f0',
                        borderRadius: 6,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'minmax(220px, 1fr) 120px 120px',
                          padding: '10px 12px',
                          background: '#fafafa',
                          fontWeight: 500,
                          borderBottom: '1px solid #f0f0f0',
                          fontSize: 13,
                        }}
                      >
                        <span>节点名称</span>
                        <span>节点编码</span>
                        <span>节点类型</span>
                      </div>
                      {treeData.map((node) => renderListNodeRow(node, 0))}
                    </div>
                  </div>
                );
              }}
            />
          </Card>
      )}

      {/* 新建模板模态框 */}
      <Modal
        title="新建组织架构模版"
        open={createModalOpen}
        onOk={handleCreateSubmit}
        onCancel={() => setCreateModalOpen(false)}
        width={820}
        destroyOnClose
        zIndex={1100}
      >
        <Form form={form} layout="vertical">
          <Title level={5}>模版基础信息</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="模版名称"
                name="name"
                rules={[{ required: true, message: '请输入模版名称' }]}
              >
                <Input placeholder="请输入模版名称" maxLength={50} showCount />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="模版编码"
                name="code"
              >
                <Input placeholder="请输入模版编码（可留空）" allowClear />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="模版模式"
                name="templateMode"
                rules={[{ required: true, message: '请选择模版模式' }]}
              >
                <Select placeholder="请选择模版模式">
                  {TEMPLATE_MODE_OPTIONS.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="适用组织规模" name="orgScale">
                <Select placeholder="请选择适用组织规模" allowClear>
                  {ORG_SCALE_OPTIONS.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="备注" name="remark">
            <TextArea rows={3} placeholder="请输入备注信息" maxLength={500} showCount />
          </Form.Item>

          <Divider />

          <Title level={5}>组织模版架构信息</Title>
          {(() => {
            const treeData = buildTreeData(templateNodes);
            const mode = form.getFieldValue('templateMode') as TemplateMode | undefined;
            const nodeTypeOpts = getNodeTypeOptionsByMode(mode);

            const gridColumns = '140px minmax(200px, 1fr) 120px 120px 140px';

            const renderTableHeader = () => (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: gridColumns,
                  padding: '10px 12px',
                  background: '#fafafa',
                  fontWeight: 500,
                  borderBottom: '1px solid #f0f0f0',
                  fontSize: 13,
                }}
              >
                <span>上级节点</span>
                <span>节点名称</span>
                <span>节点编码</span>
                <span>节点类型</span>
                <span style={{ textAlign: 'center' }}>操作</span>
              </div>
            );

            const renderTableRow = (node: any, level: number = 0) => {
              const hasChildren = node.children && node.children.length > 0;
              const isExpanded = expandedNodeIds.has(node.id);

              const rowContent = (
                <div
                  key={node.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: gridColumns,
                    padding: '8px 12px',
                    alignItems: 'center',
                    borderBottom: '1px solid #f0f0f0',
                    background: 'transparent',
                  }}
                >
                  <div>
                    <Select
                      value={node.parentNodeName || ''}
                      onChange={(value) => updateTemplateNode(node.id, 'parentNodeName', value)}
                      size="small"
                      style={{ width: '100%' }}
                      placeholder="选择上级"
                    >
                      {getParentNodeOptions(node.id, mode).map((opt) => (
                        <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                      ))}
                    </Select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {hasChildren ? (
                      <Button
                        type="text"
                        size="small"
                        icon={isExpanded ? <CaretDownOutlined style={{ fontSize: 12 }} /> : <CaretRightOutlined style={{ fontSize: 12 }} />}
                        onClick={() => toggleNodeExpand(node.id)}
                        style={{ width: 20, height: 20, padding: 0, color: token.colorTextSecondary, flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{ width: 20, height: 20, flexShrink: 0 }} />
                    )}
                    <Input
                      value={node.nodeName}
                      onChange={(e) => updateTemplateNode(node.id, 'nodeName', e.target.value)}
                      placeholder="请输入节点名称"
                      size="small"
                      style={{ flex: 1, minWidth: 0 }}
                    />
                  </div>
                  <div>
                    <Input
                      value={node.nodeCode}
                      onChange={(e) => updateTemplateNode(node.id, 'nodeCode', e.target.value)}
                      placeholder="编码"
                      size="small"
                    />
                  </div>
                  <div>
                    <Select
                      value={node.nodeType}
                      onChange={(value) => updateTemplateNode(node.id, 'nodeType', value)}
                      size="small"
                      style={{ width: '100%' }}
                    >
                      {nodeTypeOpts.map((opt) => (
                        <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                      ))}
                    </Select>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                    <Button
                      type="link"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        addChildNode(node.nodeName);
                        if (!expandedNodeIds.has(node.id)) {
                          setExpandedNodeIds((prev) => new Set([...prev, node.id]));
                        }
                      }}
                    >
                      添加
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeTemplateNode(node.id)}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              );

              if (hasChildren && isExpanded) {
                return (
                  <>
                    {rowContent}
                    {node.children.map((child: any) => renderTableRow(child, level + 1))}
                  </>
                );
              }

              return rowContent;
            };

            return (
              <>
                <div
                  style={{
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                    overflow: 'hidden',
                    maxHeight: 380,
                    overflowY: 'auto',
                  }}
                >
                  {treeData.length === 0 ? (
                    <Empty description="暂无节点" style={{ padding: '20px 0' }} />
                  ) : (
                    <>
                      {renderTableHeader()}
                      {treeData.map((node) => renderTableRow(node, 0))}
                    </>
                  )}
                </div>
              </>
            );
          })()}
        </Form>
      </Modal>

      {/* 编辑模板模态框 */}
      <Modal
        title="编辑组织架构模版"
        open={editModalOpen}
        onOk={handleEditSubmit}
        onCancel={() => setEditModalOpen(false)}
        width={820}
        destroyOnClose
        zIndex={1100}
      >
        <Form form={form} layout="vertical">
          <Title level={5}>模版基础信息</Title>
          {editingTemplate?.status === 'PUBLISHED' && (
            <div style={{ marginBottom: 16, padding: 12, background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 4 }}>
              <Text type="warning">
                <strong>提示：</strong>已发布的模板编辑后将创建新版本，状态为草稿，需重新发布后生效。
              </Text>
            </div>
          )}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="模版名称"
                name="name"
                rules={[{ required: true, message: '请输入模版名称' }]}
              >
                <Input placeholder="请输入模版名称" maxLength={50} showCount />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="模版编码"
                name="code"
              >
                <Input placeholder="请输入模版编码（可留空）" allowClear />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="模版模式"
                name="templateMode"
                rules={[{ required: true, message: '请选择模版模式' }]}
              >
                <Select placeholder="请选择模版模式">
                  {TEMPLATE_MODE_OPTIONS.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="适用组织规模" name="orgScale">
                <Select placeholder="请选择适用组织规模" allowClear>
                  {ORG_SCALE_OPTIONS.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="备注" name="remark">
            <TextArea rows={3} placeholder="请输入备注信息" maxLength={500} showCount />
          </Form.Item>

          <Divider />

          <Title level={5}>组织模版架构信息</Title>
          {(() => {
            const treeData = buildTreeData(templateNodes);
            const mode = form.getFieldValue('templateMode') as TemplateMode | undefined;
            const nodeTypeOpts = getNodeTypeOptionsByMode(mode);

            const gridColumns = '140px minmax(200px, 1fr) 120px 120px 140px';

            const renderTableHeader = () => (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: gridColumns,
                  padding: '10px 12px',
                  background: '#fafafa',
                  fontWeight: 500,
                  borderBottom: '1px solid #f0f0f0',
                  fontSize: 13,
                }}
              >
                <span>上级节点</span>
                <span>节点名称</span>
                <span>节点编码</span>
                <span>节点类型</span>
                <span style={{ textAlign: 'center' }}>操作</span>
              </div>
            );

            const renderTableRow = (node: any, level: number = 0) => {
              const hasChildren = node.children && node.children.length > 0;
              const isExpanded = expandedNodeIds.has(node.id);

              const rowContent = (
                <div
                  key={node.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: gridColumns,
                    padding: '8px 12px',
                    alignItems: 'center',
                    borderBottom: '1px solid #f0f0f0',
                    background: 'transparent',
                  }}
                >
                  <div>
                    <Select
                      value={node.parentNodeName || ''}
                      onChange={(value) => updateTemplateNode(node.id, 'parentNodeName', value)}
                      size="small"
                      style={{ width: '100%' }}
                      placeholder="选择上级"
                    >
                      {getParentNodeOptions(node.id, mode).map((opt) => (
                        <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                      ))}
                    </Select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {hasChildren ? (
                      <Button
                        type="text"
                        size="small"
                        icon={isExpanded ? <CaretDownOutlined style={{ fontSize: 12 }} /> : <CaretRightOutlined style={{ fontSize: 12 }} />}
                        onClick={() => toggleNodeExpand(node.id)}
                        style={{ width: 20, height: 20, padding: 0, color: token.colorTextSecondary, flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{ width: 20, height: 20, flexShrink: 0 }} />
                    )}
                    <Input
                      value={node.nodeName}
                      onChange={(e) => updateTemplateNode(node.id, 'nodeName', e.target.value)}
                      placeholder="请输入节点名称"
                      size="small"
                      style={{ flex: 1, minWidth: 0 }}
                    />
                  </div>
                  <div>
                    <Input
                      value={node.nodeCode}
                      onChange={(e) => updateTemplateNode(node.id, 'nodeCode', e.target.value)}
                      placeholder="编码"
                      size="small"
                    />
                  </div>
                  <div>
                    <Select
                      value={node.nodeType}
                      onChange={(value) => updateTemplateNode(node.id, 'nodeType', value)}
                      size="small"
                      style={{ width: '100%' }}
                    >
                      {nodeTypeOpts.map((opt) => (
                        <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                      ))}
                    </Select>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                    <Button
                      type="link"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        addChildNode(node.nodeName);
                        if (!expandedNodeIds.has(node.id)) {
                          setExpandedNodeIds((prev) => new Set([...prev, node.id]));
                        }
                      }}
                    >
                      添加
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeTemplateNode(node.id)}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              );

              if (hasChildren && isExpanded) {
                return (
                  <>
                    {rowContent}
                    {node.children.map((child: any) => renderTableRow(child, level + 1))}
                  </>
                );
              }

              return rowContent;
            };

            return (
              <>
                <div
                  style={{
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                    overflow: 'hidden',
                    maxHeight: 380,
                    overflowY: 'auto',
                  }}
                >
                  {treeData.length === 0 ? (
                    <Empty description="暂无节点" style={{ padding: '20px 0' }} />
                  ) : (
                    <>
                      {renderTableHeader()}
                      {treeData.map((node) => renderTableRow(node, 0))}
                    </>
                  )}
                </div>
              </>
            );
          })()}
        </Form>
      </Modal>

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
              width: 100,
              render: (_, record: Template) => (
                <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetailDrawer(record)}>
                  查看
                </Button>
              ),
            },
          ]}
        />
      </Drawer>

      {/* 模板详情弹框（置于顶层） */}
      <Modal
        title="模板详情"
        open={detailDrawerOpen}
        onCancel={() => setDetailDrawerOpen(false)}
        width={760}
        destroyOnClose
        footer={[
          <Button key="close" onClick={() => setDetailDrawerOpen(false)}>关闭</Button>
        ]}
        zIndex={1200}
        style={{ top: 20 }}
      >
        {viewingVersion && (
          <>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="模板名称" span={2}>{viewingVersion.name}</Descriptions.Item>
              <Descriptions.Item label="模板编码">{viewingVersion.code}</Descriptions.Item>
              <Descriptions.Item label="版本号">{viewingVersion.version}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <StatusTag status={getStatusTagType(viewingVersion.status)} text={getStatusText(viewingVersion.status)} />
              </Descriptions.Item>
              <Descriptions.Item label="模版模式">
                {(() => {
                  const option = TEMPLATE_MODE_OPTIONS.find((opt) => opt.value === viewingVersion.templateMode);
                  return option ? option.label : '-';
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="适用组织规模">
                {(() => {
                  const option = ORG_SCALE_OPTIONS.find((opt) => opt.value === viewingVersion.orgScale);
                  return option ? option.label : '-';
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{formatDateTime(viewingVersion.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{formatDateTime(viewingVersion.updatedAt)}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{viewingVersion.content || '暂无备注'}</div>
              </Descriptions.Item>
            </Descriptions>

            <Title level={5}>组织架构节点信息</Title>
            {viewingVersion.nodes && viewingVersion.nodes.length > 0 ? (
              <div
                style={{
                  padding: 16,
                  background: token.colorFillQuaternary,
                  borderRadius: 8,
                  maxHeight: 400,
                  overflowY: 'auto',
                }}
              >
                {(() => {
                  const treeData = buildTreeData(viewingVersion.nodes);

                  const renderDetailRow = (node: any, level: number = 0) => {
                    const hasChildren = node.children && node.children.length > 0;
                    const nodeTypeLabel = NODE_TYPE_OPTIONS.find((o: any) => o.value === node.nodeType)?.label || '-';
                    const nodeTypeColor = NODE_TYPE_COLOR_MAP[node.nodeType] || 'default';
                    const isRoot = level === 0;
                    const indent = level * 24;

                    const row = (
                      <div
                        key={node.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'minmax(220px, 1fr) 120px 140px',
                          padding: '10px 12px',
                          alignItems: 'center',
                          borderBottom: '1px solid #f0f0f0',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: indent }}>
                          {hasChildren ? (
                            <CaretDownOutlined style={{ fontSize: 12, color: token.colorTextSecondary, width: 16 }} />
                          ) : (
                            <div style={{ width: 16, height: 16 }} />
                          )}
                          {isRoot && <FolderOutlined style={{ color: '#faad14', fontSize: 14 }} />}
                          {!isRoot && <FileTextOutlined style={{ color: '#bfbfbf', fontSize: 14 }} />}
                          <span style={{ fontWeight: isRoot ? 600 : 500 }}>{node.nodeName}</span>
                        </div>
                        <div>
                          <Text type="secondary" style={{ fontSize: 12 }}>{node.nodeCode}</Text>
                        </div>
                        <div>
                          <Tag color={nodeTypeColor} style={{ margin: 0 }}>{nodeTypeLabel}</Tag>
                        </div>
                      </div>
                    );

                    if (hasChildren) {
                      return (
                        <>
                          {row}
                          {node.children.map((child: any) => renderDetailRow(child, level + 1))}
                        </>
                      );
                    }
                    return row;
                  };

                  return (
                    <>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'minmax(220px, 1fr) 120px 140px',
                          padding: '10px 12px',
                          background: '#fafafa',
                          fontWeight: 500,
                          borderBottom: '1px solid #f0f0f0',
                          fontSize: 13,
                        }}
                      >
                        <span>节点名称</span>
                        <span>节点编码</span>
                        <span>节点类型</span>
                      </div>
                      {treeData.map((node) => renderDetailRow(node, 0))}
                    </>
                  );
                })()}
              </div>
            ) : (
              <Empty description="暂无架构节点信息" />
            )}
          </>
        )}
      </Modal>
    </PageContainer>
  );
}
