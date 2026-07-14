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
  Descriptions,
  Transfer,
  Divider,
  Dropdown,
  List,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  HistoryOutlined,
  StopOutlined,
  PlayCircleOutlined,
  RollbackOutlined,
  ShareAltOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import PageContainer from '@/components/PageContainer';
import StatusTag from '@/components/StatusTag';
import { useTemplateStore } from '@/store/templateStore';
import { formatDateTime } from '@/utils/dateUtils';
import type { Template, TemplateStatus } from '@/types';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

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

export default function PositionTemplate() {
  const allTemplates = useTemplateStore((state) => state.templates);
  const addTemplate = useTemplateStore((state) => state.addTemplate);
  const updateTemplate = useTemplateStore((state) => state.updateTemplate);
  const deleteTemplate = useTemplateStore((state) => state.deleteTemplate);
  const publishTemplate = useTemplateStore((state) => state.publishTemplate);
  const deactivateTemplate = useTemplateStore((state) => state.deactivateTemplate);
  const createNewVersion = useTemplateStore((state) => state.createNewVersion);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [linkFunctionSetModalOpen, setLinkFunctionSetModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [viewingVersion, setViewingVersion] = useState<Template | null>(null);
  const [linkingTemplate, setLinkingTemplate] = useState<Template | null>(null);
  const [selectedFunctionSetKeys, setSelectedFunctionSetKeys] = useState<string[]>([]);
  const [targetFunctionSetKeys, setTargetFunctionSetKeys] = useState<string[]>([]);
  const [functionSetSearchKeyword, setFunctionSetSearchKeyword] = useState('');

  const [form] = Form.useForm();

  const posTemplates = useMemo(() => {
    return allTemplates.filter((t) => t.type === 'POSITION');
  }, [allTemplates]);

  const latestVersions = useMemo(() => {
    const codeMap = new Map<string, Template>();
    posTemplates.forEach((t) => {
      const existing = codeMap.get(t.code);
      if (!existing || t.versionNo > existing.versionNo) {
        codeMap.set(t.code, t);
      }
    });
    return Array.from(codeMap.values());
  }, [posTemplates]);

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
    return allTemplates
      .filter((t) => t.code === currentTemplate.code)
      .sort((a, b) => b.versionNo - a.versionNo);
  }, [currentTemplate, allTemplates]);

  const publishedFunctionSetTemplates = useMemo(() => {
    const fsTemplates = allTemplates.filter((t) => t.type === 'FUNCTION_SET');
    const codeMap = new Map<string, Template>();
    fsTemplates.forEach((t) => {
      const existing = codeMap.get(t.code);
      if (!existing || t.versionNo > existing.versionNo) {
        codeMap.set(t.code, t);
      }
    });
    return Array.from(codeMap.values()).filter((t) => t.status === 'PUBLISHED');
  }, [allTemplates]);

  const filteredFunctionSetTemplates = useMemo(() => {
    if (!functionSetSearchKeyword) return publishedFunctionSetTemplates;
    const kw = functionSetSearchKeyword.toLowerCase();
    return publishedFunctionSetTemplates.filter(
      (t) => t.name.toLowerCase().includes(kw) || t.code.toLowerCase().includes(kw)
    );
  }, [publishedFunctionSetTemplates, functionSetSearchKeyword]);

  const functionSetTransferData = useMemo(() => {
    return publishedFunctionSetTemplates.map((t) => ({
      key: t.id,
      title: `${t.name} (${t.code})`,
      description: t.version,
    }));
  }, [publishedFunctionSetTemplates]);

  const generateTemplateCode = useCallback(() => {
    const posTpls = allTemplates.filter((t) => t.type === 'POSITION');
    const maxNum = posTpls.reduce((max, t) => {
      const match = t.code.match(/TPL_POS_(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    return `TPL_POS_${String(maxNum + 1).padStart(3, '0')}`;
  }, [allTemplates]);

  const getLinkedFunctionSets = (template: Template): string[] => {
    try {
      if (template.content) {
        const parsed = JSON.parse(template.content);
        return parsed.functionSetIds || [];
      }
    } catch {
      // ignore
    }
    return [];
  };

  const getLinkedFunctionSetTemplates = (template: Template): Template[] => {
    const linkedIds = getLinkedFunctionSets(template);
    return publishedFunctionSetTemplates.filter((t) => linkedIds.includes(t.id));
  };

  const openCreateModal = () => {
    form.resetFields();
    form.setFieldsValue({
      name: '',
      code: '',
      description: '',
      status: 'DRAFT',
    });
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async () => {
    try {
      const values = await form.validateFields();
      const finalCode = values.code || generateTemplateCode();
      addTemplate({
        code: finalCode,
        name: values.name,
        version: 'v1.0.0',
        status: 'DRAFT',
        type: 'POSITION',
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
    setDetailModalOpen(true);
  };

  const openLinkFunctionSetModal = (template: Template) => {
    setLinkingTemplate(template);
    const linkedIds = getLinkedFunctionSets(template);
    setTargetFunctionSetKeys(linkedIds);
    setSelectedFunctionSetKeys([]);
    setFunctionSetSearchKeyword('');
    setLinkFunctionSetModalOpen(true);
  };

  const handleLinkFunctionSetSubmit = () => {
    if (linkingTemplate) {
      try {
        let content: any = {};
        if (linkingTemplate.content) {
          try {
            content = JSON.parse(linkingTemplate.content);
          } catch {
            content = {};
          }
        }
        content.functionSetIds = targetFunctionSetKeys;

        if (linkingTemplate.status === 'PUBLISHED') {
          const newVersionNo = linkingTemplate.versionNo + 1;
          createNewVersion(
            linkingTemplate.id,
            `v${newVersionNo}.0.0`,
            JSON.stringify(content)
          );
          message.success('关联成功，已创建新版本');
        } else {
          updateTemplate(linkingTemplate.id, {
            content: JSON.stringify(content),
          });
          message.success('关联成功');
        }
        setLinkFunctionSetModalOpen(false);
      } catch {
        message.error('操作失败');
      }
    }
  };

  const tableColumns = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
      width: 220,
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
      width: 160,
    },
    {
      title: '关联职能集模版',
      key: 'linkedFunctionSets',
      width: 220,
      render: (_, record: Template) => {
        const linked = getLinkedFunctionSetTemplates(record);
        if (linked.length === 0) {
          return <Text type="secondary" style={{ fontSize: 12 }}>未关联</Text>;
        }
        return (
          <Space size={[4, 4]} wrap>
            {linked.slice(0, 2).map((t) => (
              <Tag key={t.id} color="purple" style={{ margin: 0 }}>{t.name}</Tag>
            ))}
            {linked.length > 2 && (
              <Tag color="default" style={{ margin: 0 }}>+{linked.length - 2}</Tag>
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
                  key: 'linkFunctionSet',
                  icon: <ShareAltOutlined />,
                  label: '关联职能集模版',
                  onClick: () => openLinkFunctionSetModal(record),
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

  return (
    <PageContainer title="岗位模版" subTitle="管理岗位体系模版及其版本">
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
          <Tag color="blue">模版编码：可手动输入，留空自动生成</Tag>
          <Tag color="cyan">关联职能集模版：支持名称搜索，可多选</Tag>
          <Tag color="green">启用/停用/发布/删除：状态实时更新</Tag>
          <Tag color="orange">版本详情：弹框展示，置于顶层</Tag>
        </Space>
      </div>

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
        title="新建岗位模版"
        open={createModalOpen}
        onOk={handleCreateSubmit}
        onCancel={() => setCreateModalOpen(false)}
        width={600}
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
                <Input placeholder="请输入模版编码（可留空自动生成）" allowClear />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="备注" name="description">
            <TextArea rows={3} placeholder="请输入备注信息" maxLength={500} showCount />
          </Form.Item>

          <Divider />

          <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
            <Text type="secondary">
              <strong>提示：</strong>模版创建后默认状态为「草稿」，模版编码可手动输入，留空将自动生成。关联职能集模版功能在列表操作中进行。
            </Text>
          </div>
        </Form>
      </Modal>

      {/* 编辑模板模态框 */}
      <Modal
        title="编辑岗位模版"
        open={editModalOpen}
        onOk={handleEditSubmit}
        onCancel={() => setEditModalOpen(false)}
        width={600}
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
                <Input placeholder="请输入模版编码" allowClear />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="备注" name="description">
            <TextArea rows={3} placeholder="请输入备注信息" maxLength={500} showCount />
          </Form.Item>

          <Divider />

          <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
            <Text type="secondary">
              <strong>提示：</strong>关联职能集模版功能在列表操作中进行。
            </Text>
          </div>
        </Form>
      </Modal>

      {/* 关联职能集模版模态框 */}
      <Modal
        title={
          linkingTemplate && getLinkedFunctionSetTemplates(linkingTemplate).length > 0
            ? '编辑关联职能集模版'
            : '新增关联职能集模版'
        }
        open={linkFunctionSetModalOpen}
        onOk={handleLinkFunctionSetSubmit}
        onCancel={() => setLinkFunctionSetModalOpen(false)}
        width={760}
        destroyOnClose
        zIndex={1100}
      >
        {linkingTemplate && (
          <>
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <Space>
                <Text type="secondary">当前模版：</Text>
                <Text strong>{linkingTemplate.name}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{linkingTemplate.code}</Text>
              </Space>
            </div>

            {getLinkedFunctionSetTemplates(linkingTemplate).length > 0 && (
              <>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>已关联职能集模版（{getLinkedFunctionSetTemplates(linkingTemplate).length}）</div>
                <List
                  size="small"
                  bordered
                  dataSource={getLinkedFunctionSetTemplates(linkingTemplate)}
                  renderItem={(fs) => (
                    <List.Item>
                      <List.Item.Meta
                        title={fs.name}
                        description={`${fs.code} · ${fs.version}`}
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
              <Text type="secondary">从已发布的职能集模板中选择要关联的职能集模版：</Text>
              <Input.Search
                placeholder="搜索职能集名称"
                allowClear
                style={{ width: 220 }}
                value={functionSetSearchKeyword}
                onChange={(e) => setFunctionSetSearchKeyword(e.target.value)}
              />
            </div>

            {functionSetSearchKeyword && filteredFunctionSetTemplates.length === 0 ? (
              <Empty description="没有找到匹配的职能集模板" />
            ) : (
              <Transfer
                dataSource={functionSetTransferData.filter((d) => {
                  if (!functionSetSearchKeyword) return true;
                  const kw = functionSetSearchKeyword.toLowerCase();
                  return d.title.toLowerCase().includes(kw);
                })}
                titles={['可关联职能集模版', '已关联职能集模版']}
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
            )}
            {linkingTemplate?.status === 'PUBLISHED' && (
              <div style={{ marginTop: 16, padding: 12, background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 4 }}>
                <Text type="warning">
                  <strong>提示：</strong>已发布的模板修改关联后将创建新版本，状态为草稿，需重新发布后生效。
                </Text>
              </div>
            )}
          </>
        )}
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
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        width={600}
        destroyOnClose
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>
        ]}
        zIndex={1200}
        style={{ top: 20 }}
      >
        {viewingVersion && (
          <>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="模板名称">{viewingVersion.name}</Descriptions.Item>
              <Descriptions.Item label="模板编码">{viewingVersion.code}</Descriptions.Item>
              <Descriptions.Item label="版本号">{viewingVersion.version}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <StatusTag status={getStatusTagType(viewingVersion.status)} text={getStatusText(viewingVersion.status)} />
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{formatDateTime(viewingVersion.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{formatDateTime(viewingVersion.updatedAt)}</Descriptions.Item>
              <Descriptions.Item label="模板描述">
                <div style={{ whiteSpace: 'pre-wrap' }}>{viewingVersion.content || '暂无描述'}</div>
              </Descriptions.Item>
            </Descriptions>

            <Title level={5}>关联职能集模版（{getLinkedFunctionSetTemplates(viewingVersion).length}）</Title>
            {getLinkedFunctionSetTemplates(viewingVersion).length > 0 ? (
              <List
                size="small"
                bordered
                dataSource={getLinkedFunctionSetTemplates(viewingVersion)}
                renderItem={(fs) => (
                  <List.Item>
                    <List.Item.Meta
                      title={fs.name}
                      description={`${fs.code} · ${fs.version}`}
                    />
                    <Tag color="green">已关联</Tag>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无关联职能集模版" />
            )}
          </>
        )}
      </Modal>
    </PageContainer>
  );
}
