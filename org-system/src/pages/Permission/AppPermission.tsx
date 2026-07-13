import { useState, useMemo } from 'react';
import {
  Input,
  List,
  Card,
  Tabs,
  Tree,
  Radio,
  Button,
  Space,
  Tag,
  message,
  Row,
  Col,
  Select,
  Table,
  Drawer,
  Modal,
  Checkbox,
  Divider,
  Form,
  DatePicker,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import type { ColumnsType } from 'antd/es/table/interface';
import {
  SearchOutlined,
  SafetyCertificateOutlined,
  AppstoreOutlined,
  MenuOutlined,
  SettingOutlined,
  DatabaseOutlined,
  TeamOutlined,
  UserOutlined,
  EyeOutlined,
  EditOutlined,
  SolutionOutlined,
} from '@ant-design/icons';
import PageContainer from '@/components/PageContainer';
import { useFunctionSetStore } from '@/store/functionSetStore';
import { useResourceStore } from '@/store/resourceStore';
import { useOrgStore } from '@/store/orgStore';
import { usePositionStore } from '@/store/positionStore';
import { useUserStore } from '@/store/userStore';
import type { FunctionSet, Resource, OrgNode, DataPermissionConfig, Position, User } from '@/types';

const { Option } = Select;

const dataScopeOptions = [
  { label: '本机构', value: 'COMPANY' },
  { label: '本部门', value: 'DEPT' },
  { label: '本部门及下级部门', value: 'DEPT_AND_CHILD' },
  { label: '指定部门', value: 'CUSTOM' },
  { label: '本人', value: 'SELF' },
];

const appOptions = [
  { label: '智慧园区管理系统', value: 'app-001' },
  { label: '电商平台系统', value: 'app-002' },
  { label: 'OA办公系统', value: 'app-003' },
  { label: '客户关系管理', value: 'app-004' },
];

interface MetaModel {
  id: string;
  code: string;
  name: string;
  appId: string;
}

interface MetaField {
  id: string;
  code: string;
  name: string;
  modelId: string;
  add: boolean;
  view: boolean;
  edit: boolean;
}

const metaModels: MetaModel[] = [
  { id: 'model-001', code: 'MODEL_USER', name: '用户模型', appId: 'app-001' },
  { id: 'model-002', code: 'MODEL_ORG', name: '组织模型', appId: 'app-001' },
  { id: 'model-003', code: 'MODEL_POSITION', name: '岗位模型', appId: 'app-001' },
  { id: 'model-004', code: 'MODEL_PROJECT', name: '项目模型', appId: 'app-001' },
  { id: 'model-005', code: 'MODEL_TASK', name: '任务模型', appId: 'app-001' },
  { id: 'model-006', code: 'MODEL_PRODUCT', name: '商品模型', appId: 'app-002' },
  { id: 'model-007', code: 'MODEL_ORDER', name: '订单模型', appId: 'app-002' },
  { id: 'model-008', code: 'MODEL_CUSTOMER', name: '客户模型', appId: 'app-002' },
];

const metaFields: MetaField[] = [
  { id: 'field-001', code: 'USER_ID', name: '用户ID', modelId: 'model-001', add: true, view: true, edit: false },
  { id: 'field-002', code: 'USER_NAME', name: '用户名', modelId: 'model-001', add: true, view: true, edit: true },
  { id: 'field-003', code: 'USER_REALNAME', name: '真实姓名', modelId: 'model-001', add: true, view: true, edit: true },
  { id: 'field-004', code: 'USER_EMAIL', name: '邮箱', modelId: 'model-001', add: true, view: true, edit: true },
  { id: 'field-005', code: 'USER_PHONE', name: '手机号', modelId: 'model-001', add: true, view: true, edit: true },
  { id: 'field-006', code: 'USER_STATUS', name: '状态', modelId: 'model-001', add: true, view: true, edit: true },
  { id: 'field-007', code: 'ORG_ID', name: '组织ID', modelId: 'model-002', add: true, view: true, edit: false },
  { id: 'field-008', code: 'ORG_NAME', name: '组织名称', modelId: 'model-002', add: true, view: true, edit: true },
  { id: 'field-009', code: 'ORG_TYPE', name: '组织类型', modelId: 'model-002', add: true, view: true, edit: true },
  { id: 'field-010', code: 'ORG_STATUS', name: '状态', modelId: 'model-002', add: true, view: true, edit: true },
  { id: 'field-011', code: 'POS_ID', name: '岗位ID', modelId: 'model-003', add: true, view: true, edit: false },
  { id: 'field-012', code: 'POS_NAME', name: '岗位名称', modelId: 'model-003', add: true, view: true, edit: true },
  { id: 'field-013', code: 'POS_STATUS', name: '状态', modelId: 'model-003', add: true, view: true, edit: true },
  { id: 'field-014', code: 'PROJ_ID', name: '项目ID', modelId: 'model-004', add: true, view: true, edit: false },
  { id: 'field-015', code: 'PROJ_NAME', name: '项目名称', modelId: 'model-004', add: true, view: true, edit: true },
  { id: 'field-016', code: 'PROJ_DESC', name: '项目描述', modelId: 'model-004', add: true, view: true, edit: true },
  { id: 'field-017', code: 'TASK_ID', name: '任务ID', modelId: 'model-005', add: true, view: true, edit: false },
  { id: 'field-018', code: 'TASK_NAME', name: '任务名称', modelId: 'model-005', add: true, view: true, edit: true },
  { id: 'field-019', code: 'TASK_STATUS', name: '任务状态', modelId: 'model-005', add: true, view: true, edit: true },
];

type LeftTabType = 'functionSet' | 'position';

export default function AppPermission() {
  const { functionSets } = useFunctionSetStore();
  const { getTree, getFlatList } = useResourceStore();
  const { getTree: getOrgTree } = useOrgStore();
  const { positions } = usePositionStore();
  const { users } = useUserStore();

  const [leftTab, setLeftTab] = useState<LeftTabType>('functionSet');
  const [selectedAppId, setSelectedAppId] = useState<string>('app-001');
  const [keyword, setKeyword] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('function');

  const [checkedResourceKeys, setCheckedResourceKeys] = useState<React.Key[]>([]);

  const [dataScope, setDataScope] = useState<string>('DEPT');
  const [selectedDeptIds, setSelectedDeptIds] = useState<React.Key[]>([]);

  const [metaDrawerOpen, setMetaDrawerOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState<MetaModel | null>(null);
  const [fieldPermissions, setFieldPermissions] = useState<MetaField[]>([]);

  interface OperationPermission {
    id: string;
    name: string;
    type: '新增' | '已有';
    allow: boolean;
    dataScope: string;
  }

  const [operationPermissions, setOperationPermissions] = useState<OperationPermission[]>([
    { id: 'op-001', name: '添加', type: '新增', allow: true, dataScope: '' },
    { id: 'op-002', name: '查看', type: '已有', allow: true, dataScope: '本人' },
    { id: 'op-003', name: '编辑', type: '已有', allow: true, dataScope: '本部门' },
    { id: 'op-004', name: '删除', type: '已有', allow: true, dataScope: '本部门' },
  ]);

  interface DataScopeItem {
    id: string;
    name: string;
  }

  const [dataScopeList, setDataScopeList] = useState<DataScopeItem[]>([
    { id: 'scope-001', name: '所有数据' },
    { id: 'scope-002', name: '自己的数据' },
  ]);

  const [dataScopeModalOpen, setDataScopeModalOpen] = useState(false);
  const [currentOpId, setCurrentOpId] = useState<string>('');
  const [selectedDataScope, setSelectedDataScope] = useState<string>('');

  const [addScopeModalOpen, setAddScopeModalOpen] = useState(false);
  const [scopeForm] = Form.useForm();

  interface ScopeCondition {
    id: string;
    field: string;
    operator: string;
    value: string;
    dateValue?: string;
  }

  const [scopeConditions, setScopeConditions] = useState<ScopeCondition[]>([
    { id: 'cond-001', field: 'Last updated at', operator: '等于', value: '', dateValue: '' },
    { id: 'cond-002', field: 'Status', operator: '等于', value: '', dateValue: '' },
  ]);

  const fieldOptions = [
    'Last updated at',
    'Status',
    'Created at',
    'Name',
    'Code',
    'Description',
  ];

  const operatorOptions = [
    '等于',
    '不等于',
    '包含任何一个',
    '不包含任何一个',
    '为空',
    '不为空',
  ];

  const handleOpenDataScope = (opId: string, currentScope: string) => {
    setCurrentOpId(opId);
    const found = dataScopeList.find((s) => s.name === currentScope);
    setSelectedDataScope(found?.id || '');
    setDataScopeModalOpen(true);
  };

  const handleConfirmDataScope = () => {
    const scope = dataScopeList.find((s) => s.id === selectedDataScope);
    if (scope) {
      setOperationPermissions((prev) =>
        prev.map((o) => (o.id === currentOpId ? { ...o, dataScope: scope.name } : o))
      );
    }
    setDataScopeModalOpen(false);
  };

  const handleAddScope = () => {
    setAddScopeModalOpen(true);
  };

  const handleSubmitScope = async () => {
    try {
      const values = await scopeForm.validateFields();
      const newScope: DataScopeItem = {
        id: `scope-${Date.now()}`,
        name: values.scopeName,
      };
      setDataScopeList((prev) => [...prev, newScope]);
      message.success('数据范围添加成功');
      setAddScopeModalOpen(false);
      scopeForm.resetFields();
      setScopeConditions([
        { id: `cond-${Date.now()}`, field: 'Last updated at', operator: '等于', value: '', dateValue: '' },
      ]);
    } catch (error) {
      // 表单验证失败
    }
  };

  const addCondition = () => {
    setScopeConditions((prev) => [
      ...prev,
      { id: `cond-${Date.now()}`, field: 'Last updated at', operator: '等于', value: '', dateValue: '' },
    ]);
  };

  const removeCondition = (id: string) => {
    setScopeConditions((prev) => prev.filter((c) => c.id !== id));
  };

  const leftTabItems = [
    { key: 'functionSet' as LeftTabType, label: '职能集', icon: <AppstoreOutlined /> },
    { key: 'position' as LeftTabType, label: '岗位', icon: <TeamOutlined /> },
  ];

  const activeFunctionSets = useMemo(() => {
    let result = functionSets.filter((fs) => fs.status === 'ACTIVE');
    if (keyword) {
      const kw = keyword.toLowerCase();
      result = result.filter((fs) => fs.name.toLowerCase().includes(kw) || fs.code.toLowerCase().includes(kw));
    }
    return result;
  }, [functionSets, keyword]);

  const activePositions = useMemo(() => {
    let result = positions.filter((p) => p.status === 'ACTIVE');
    if (keyword) {
      const kw = keyword.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(kw) || p.code.toLowerCase().includes(kw));
    }
    return result;
  }, [positions, keyword]);

  const activeUsers = useMemo(() => {
    let result = users.filter((u) => u.status === 'NORMAL');
    if (keyword) {
      const kw = keyword.toLowerCase();
      result = result.filter((u) => u.name.toLowerCase().includes(kw) || u.username.toLowerCase().includes(kw));
    }
    return result;
  }, [users, keyword]);

  const selectedItemName = useMemo(() => {
    if (!selectedId) return '';
    if (leftTab === 'functionSet') {
      return functionSets.find((fs) => fs.id === selectedId)?.name || '';
    }
    if (leftTab === 'position') {
      return positions.find((p) => p.id === selectedId)?.name || '';
    }
    return users.find((u) => u.id === selectedId)?.name || '';
  }, [selectedId, leftTab, functionSets, positions, users]);

  const selectedItemCode = useMemo(() => {
    if (!selectedId) return '';
    if (leftTab === 'functionSet') {
      return functionSets.find((fs) => fs.id === selectedId)?.code || '';
    }
    if (leftTab === 'position') {
      return positions.find((p) => p.id === selectedId)?.code || '';
    }
    return users.find((u) => u.id === selectedId)?.code || '';
  }, [selectedId, leftTab, functionSets, positions, users]);

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

  const appMetaModels = useMemo(() => {
    return metaModels.filter((m) => m.appId === selectedAppId);
  }, [selectedAppId]);

  const handleSelectItem = (id: string) => {
    setSelectedId(id);
    setCheckedResourceKeys([]);
    setDataScope('DEPT');
    setSelectedDeptIds([]);
  };

  const onResourceCheck = (checked: React.Key[] | { checked: React.Key[]; halfChecked: React.Key[] }) => {
    if (Array.isArray(checked)) {
      setCheckedResourceKeys(checked);
    } else {
      setCheckedResourceKeys(checked.checked);
    }
  };

  const handleSaveFunctionPermission = () => {
    if (!selectedId) {
      message.warning('请先选择一项');
      return;
    }
    message.success('功能权限保存成功');
  };

  const handleSaveDataPermission = () => {
    if (!selectedId) {
      message.warning('请先选择一项');
      return;
    }
    message.success('数据权限保存成功');
  };

  const handleConfigMetaPermission = (model: MetaModel) => {
    setCurrentModel(model);
    const modelFields = metaFields.filter((f) => f.modelId === model.id);
    setFieldPermissions(modelFields.map((f) => ({ ...f })));
    setMetaDrawerOpen(true);
  };

  const handleFieldPermissionChange = (fieldId: string, type: 'add' | 'view' | 'edit', checked: boolean) => {
    setFieldPermissions((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, [type]: checked } : f))
    );
  };

  const handleSaveMetaPermission = () => {
    message.success('元模型权限保存成功');
    setMetaDrawerOpen(false);
  };

  const buildPositionTree = useMemo<DataNode[]>(() => {
    const addPositionsToNodes = (nodes: DataNode[]): DataNode[] => {
      return nodes.map((node) => {
        const nodePositions = positions.filter(
          (p) => p.orgNodeId === node.key && p.status === 'ACTIVE'
        );
        const positionChildren: DataNode[] = nodePositions.map((p) => ({
          title: (
            <Space>
              <SolutionOutlined style={{ color: '#faad14', fontSize: 14 }} />
              <span>{p.name}</span>
            </Space>
          ),
          key: p.id,
          isLeaf: true,
        }));
        const childNodes = node.children ? addPositionsToNodes(node.children) : [];
        return {
          ...node,
          title: (
            <Space>
              <TeamOutlined style={{ color: '#722ed1', fontSize: 14 }} />
              <span>{typeof node.title === 'string' ? node.title : ''}</span>
            </Space>
          ),
          children: [...childNodes, ...positionChildren],
        };
      });
    };
    return addPositionsToNodes(orgTreeData);
  }, [orgTreeData, positions]);

  const buildUserTree = useMemo<DataNode[]>(() => {
    const addUsersToNodes = (nodes: DataNode[]): DataNode[] => {
      return nodes.map((node) => {
        const nodePositions = positions.filter(
          (p) => p.orgNodeId === node.key && p.status === 'ACTIVE'
        );
        const positionChildren: DataNode[] = nodePositions.map((p) => {
          const positionUsers = users.filter(
            (u) => u.positionIds.includes(p.id) && u.status === 'NORMAL'
          );
          const userChildren: DataNode[] = positionUsers.map((u) => ({
            title: (
              <Space>
                <UserOutlined style={{ color: '#1890ff', fontSize: 14 }} />
                <span>{u.name}</span>
              </Space>
            ),
            key: u.id,
            isLeaf: true,
          }));
          return {
            title: (
              <Space>
                <SolutionOutlined style={{ color: '#faad14', fontSize: 14 }} />
                <span>{p.name}</span>
              </Space>
            ),
            key: p.id,
            children: userChildren,
          };
        });
        const childNodes = node.children ? addUsersToNodes(node.children) : [];
        return {
          ...node,
          title: (
            <Space>
              <TeamOutlined style={{ color: '#722ed1', fontSize: 14 }} />
              <span>{typeof node.title === 'string' ? node.title : ''}</span>
            </Space>
          ),
          children: [...childNodes, ...positionChildren],
        };
      });
    };
    return addUsersToNodes(orgTreeData);
  }, [orgTreeData, positions, users]);

  const renderLeftList = () => {
    if (leftTab === 'functionSet') {
      return (
        <List
          dataSource={activeFunctionSets}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                background: selectedId === item.id ? '#e6f4ff' : 'transparent',
                borderLeft: selectedId === item.id ? '3px solid #1677ff' : '3px solid transparent',
              }}
              onClick={() => handleSelectItem(item.id)}
            >
              <List.Item.Meta
                avatar={<AppstoreOutlined style={{ color: '#1677ff' }} />}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.name}</span>
                    <Tag color="green" style={{ fontSize: 10 }}>启用</Tag>
                  </div>
                }
                description={item.code}
              />
            </List.Item>
          )}
        />
      );
    }
    if (leftTab === 'position') {
      return (
        <div style={{ padding: '0 8px' }}>
          <Tree
            treeData={buildPositionTree}
            selectedKeys={selectedId ? [selectedId] : []}
            onSelect={(keys) => {
              const key = keys[0] as string;
              if (key && positions.some((p) => p.id === key)) {
                handleSelectItem(key);
              }
            }}
            defaultExpandAll
          />
        </div>
      );
    }
  };

  const metaColumns: ColumnsType<MetaModel> = [
    {
      title: '模型名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '模型编码',
      dataIndex: 'code',
      key: 'code',
      width: 200,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => handleConfigMetaPermission(record)}>
          权限配置
        </Button>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'function',
      label: (
        <span>
          <AppstoreOutlined /> 功能权限
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Row gutter={16} align="middle">
              <Col span={12}>
                <Input placeholder="资源名称" prefix={<SearchOutlined />} allowClear />
              </Col>
              <Col span={12}>
                <Select placeholder="资源类型" allowClear style={{ width: '100%' }}>
                  <Option value="CATALOG">目录</Option>
                  <Option value="MENU">菜单</Option>
                  <Option value="BUTTON">按钮</Option>
                </Select>
              </Col>
            </Row>
          </div>
          <div
            style={{
              border: '1px solid #f0f0f0',
              borderRadius: 4,
              padding: 12,
              maxHeight: 'calc(100vh - 400px)',
              overflow: 'auto',
            }}
          >
            <Tree
              checkable
              treeData={resourceTreeData}
              checkedKeys={checkedResourceKeys}
              onCheck={onResourceCheck as any}
            />
          </div>
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button type="primary" onClick={handleSaveFunctionPermission}>保存</Button>
          </div>
        </div>
      ),
    },
    {
      key: 'meta',
      label: (
        <span>
          <DatabaseOutlined /> 元模型权限
        </span>
      ),
      children: (
        <div>
          <Table<MetaModel>
            rowKey="id"
            columns={metaColumns}
            dataSource={appMetaModels}
            pagination={false}
            size="middle"
          />
        </div>
      ),
    },
  ];

  return (
    <PageContainer title="应用权限配置" subTitle="配置应用级权限">
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <span style={{ color: '#666' }}>选择应用：</span>
          <Select value={selectedAppId} onChange={(val) => { setSelectedAppId(val); setSelectedId(null); }} style={{ width: 280 }}>
            {appOptions.map((app) => (
              <Option key={app.value} value={app.value}>{app.label}</Option>
            ))}
          </Select>
        </Space>
      </Card>
      <Row gutter={16} style={{ height: 'calc(100vh - 220px)' }}>
        <Col span={6}>
          <Card
            style={{ height: '100%', overflow: 'hidden' }}
            bodyStyle={{ height: 'calc(100% - 57px)', overflow: 'auto', padding: 0 }}
            title={
              <Tabs
                activeKey={leftTab}
                onChange={(key) => { setLeftTab(key as LeftTabType); setSelectedId(null); setKeyword(''); }}
                size="small"
                items={leftTabItems.map((item) => ({ key: item.key, label: <span>{item.icon} {item.label}</span> }))}
              />
            }
          >
            <div style={{ padding: 12 }}>
              <Input
                placeholder={`搜索${leftTabItems.find((i) => i.key === leftTab)?.label}`}
                prefix={<SearchOutlined />}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                allowClear
              />
            </div>
            {renderLeftList()}
          </Card>
        </Col>
        <Col span={18}>
          <Card style={{ height: '100%', overflow: 'hidden' }} bodyStyle={{ height: '100%', overflow: 'auto' }}>
            {selectedId ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                    {selectedItemName}
                  </div>
                  <div style={{ color: '#999', fontSize: 12 }}>
                    {selectedItemCode} | {leftTabItems.find((i) => i.key === leftTab)?.label}
                  </div>
                </div>
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '100px 0', color: '#999' }}>
                <SettingOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <div>请在左侧选择职能集/岗位/用户进行权限配置</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Drawer
        title="配置权限"
        placement="right"
        width={700}
        open={metaDrawerOpen}
        onClose={() => setMetaDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setMetaDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleSaveMetaPermission}>保存</Button>
          </Space>
        }
      >
        {currentModel && (
          <>
            <Divider orientation="left">
              <span style={{ fontWeight: 500 }}>
                {currentModel.name}（{currentModel.code}）
              </span>
            </Divider>

            <div style={{ fontWeight: 500, marginBottom: 8 }}>操作权限：</div>
            <Table<OperationPermission>
              rowKey="id"
              columns={[
                {
                  title: '操作名称',
                  dataIndex: 'name',
                  key: 'name',
                  width: 120,
                },
                {
                  title: '操作类型',
                  key: 'type',
                  width: 140,
                  align: 'center',
                  render: (_, record) => (
                    <Tag
                      color={record.type === '新增' ? 'green' : 'blue'}
                      style={{ margin: 0 }}
                    >
                      {record.type === '新增' ? '对新增数据操作' : '对已有数据操作'}
                    </Tag>
                  ),
                },
                {
                  title: (
                    <span>
                      <Checkbox
                        checked={operationPermissions.every((o) => o.allow)}
                        indeterminate={operationPermissions.some((o) => o.allow) && !operationPermissions.every((o) => o.allow)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setOperationPermissions((prev) =>
                            prev.map((o) => ({ ...o, allow: checked }))
                          );
                        }}
                      />
                      <span style={{ marginLeft: 8 }}>允许</span>
                    </span>
                  ),
                  key: 'allow',
                  width: 100,
                  align: 'center',
                  render: (_, record) => (
                    <Checkbox
                      checked={record.allow}
                      onChange={(e) => {
                        setOperationPermissions((prev) =>
                          prev.map((o) => (o.id === record.id ? { ...o, allow: e.target.checked } : o))
                        );
                      }}
                    />
                  ),
                },
                {
                  title: '数据范围',
                  key: 'dataScope',
                  render: (_, record) => {
                    if (!record.allow || !record.dataScope) return null;
                    return (
                      <Select
                        value={record.dataScope}
                        onChange={(value) => {
                          if (value === 'CUSTOM') {
                            setCurrentOpId(record.id);
                            setSelectedDataScope('');
                            setDataScopeModalOpen(true);
                          } else {
                            setOperationPermissions((prev) =>
                              prev.map((o) => (o.id === record.id ? { ...o, dataScope: value } : o))
                            );
                          }
                        }}
                        size="small"
                        style={{ width: 150 }}
                        options={[
                          { value: '本人', label: '本人' },
                          { value: '本部门', label: '本部门' },
                          { value: '本部门及下级部门', label: '本部门及下级部门' },
                          { value: '指定部门', label: '指定部门' },
                          { value: 'CUSTOM', label: '自定义' },
                        ]}
                      />
                    );
                  },
                },
              ]}
              dataSource={operationPermissions}
              pagination={false}
              size="small"
              bordered
              style={{ marginBottom: 16 }}
            />

            <div style={{ fontWeight: 500, marginBottom: 8 }}>字段权限：</div>
            <Table<MetaField>
              rowKey="id"
              columns={[
                {
                  title: '字段名称',
                  dataIndex: 'name',
                  key: 'name',
                  width: 150,
                  render: (text, record) => (
                    <div>
                      <div>{text}</div>
                      <div style={{ color: '#999', fontSize: 12 }}>{record.code}</div>
                    </div>
                  ),
                },
                {
                  title: (
                    <span>
                      <Checkbox
                        checked={fieldPermissions.every((f) => f.add)}
                        indeterminate={fieldPermissions.some((f) => f.add) && !fieldPermissions.every((f) => f.add)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFieldPermissions((prev) =>
                            prev.map((f) => ({ ...f, add: checked }))
                          );
                        }}
                      />
                      <span style={{ marginLeft: 8 }}>添加</span>
                    </span>
                  ),
                  key: 'add',
                  width: 90,
                  align: 'center',
                  render: (_, record) => (
                    <Checkbox
                      checked={record.add}
                      onChange={(e) => handleFieldPermissionChange(record.id, 'add', e.target.checked)}
                    />
                  ),
                },
                {
                  title: (
                    <span>
                      <Checkbox
                        checked={fieldPermissions.every((f) => f.view)}
                        indeterminate={fieldPermissions.some((f) => f.view) && !fieldPermissions.every((f) => f.view)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFieldPermissions((prev) =>
                            prev.map((f) => ({ ...f, view: checked }))
                          );
                        }}
                      />
                      <span style={{ marginLeft: 8 }}>查看</span>
                    </span>
                  ),
                  key: 'view',
                  width: 90,
                  align: 'center',
                  render: (_, record) => (
                    <Checkbox
                      checked={record.view}
                      onChange={(e) => handleFieldPermissionChange(record.id, 'view', e.target.checked)}
                    />
                  ),
                },
                {
                  title: (
                    <span>
                      <Checkbox
                        checked={fieldPermissions.every((f) => f.edit)}
                        indeterminate={fieldPermissions.some((f) => f.edit) && !fieldPermissions.every((f) => f.edit)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFieldPermissions((prev) =>
                            prev.map((f) => ({ ...f, edit: checked && f.view }))
                          );
                        }}
                      />
                      <span style={{ marginLeft: 8 }}>编辑</span>
                    </span>
                  ),
                  key: 'edit',
                  width: 90,
                  align: 'center',
                  render: (_, record) => (
                    <Checkbox
                      checked={record.edit}
                      disabled={!record.view}
                      onChange={(e) => handleFieldPermissionChange(record.id, 'edit', e.target.checked)}
                    />
                  ),
                },
              ]}
              dataSource={fieldPermissions}
              pagination={false}
              size="small"
              bordered
            />
          </>
        )}
      </Drawer>

      <Modal
        title="选择数据"
        open={dataScopeModalOpen}
        onCancel={() => setDataScopeModalOpen(false)}
        onOk={handleConfirmDataScope}
        okText="确定"
        cancelText="取消"
        width={600}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setDataScopeModalOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleConfirmDataScope}>确定</Button>
          </div>
        }
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Button type="primary" onClick={handleAddScope}>
            + 添加
          </Button>
        </div>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid #f0f0f0',
          }}
        >
          <thead>
            <tr style={{ background: '#fafafa', fontWeight: 500 }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>
                数据范围名称
              </th>
              <th
                style={{
                  padding: '12px',
                  textAlign: 'center',
                  borderBottom: '1px solid #f0f0f0',
                  width: 200,
                }}
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {dataScopeList.map((scope) => (
              <tr
                key={scope.id}
                style={{
                  background: selectedDataScope === scope.id ? '#e6f4ff' : 'transparent',
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedDataScope(scope.id)}
              >
                <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                  <Radio
                    checked={selectedDataScope === scope.id}
                    onChange={() => setSelectedDataScope(scope.id)}
                  >
                    {scope.name}
                  </Radio>
                </td>
                <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                  <Space size="middle">
                    <Button type="link" size="small">
                      编辑
                    </Button>
                    <Button type="link" size="small" danger>
                      删除
                    </Button>
                  </Space>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginTop: 16,
            gap: 8,
            fontSize: 13,
          }}
        >
          <span>总共 {dataScopeList.length} 条</span>
          <Select defaultValue="1" size="small" style={{ width: 90 }}>
            <Select.Option value="1">第 1 页</Select.Option>
          </Select>
          <Select defaultValue="20" size="small" style={{ width: 80 }}>
            <Select.Option value="20">20条/页</Select.Option>
          </Select>
        </div>
      </Modal>

      <Modal
        title="新增数据范围"
        open={addScopeModalOpen}
        onCancel={() => setAddScopeModalOpen(false)}
        onOk={handleSubmitScope}
        okText="提交"
        cancelText="取消"
        width={600}
        destroyOnClose
      >
        <Form form={scopeForm} layout="vertical">
          <Form.Item
            label="数据范围名称"
            name="scopeName"
            rules={[{ required: true, message: '请输入数据范围名称' }]}
          >
            <Input placeholder="请输入数据范围名称" />
          </Form.Item>
        </Form>

        <div style={{ marginBottom: 8, fontWeight: 500 }}>数据范围：</div>
        <div style={{ marginBottom: 12 }}>
          <span style={{ color: '#999' }}>满足组内</span>
          <Select defaultValue="all" size="small" style={{ width: 80, margin: '0 8px' }}>
            <Select.Option value="all">全部</Select.Option>
          </Select>
          <span style={{ color: '#999' }}>条件</span>
        </div>

        <div style={{ marginBottom: 16 }}>
          {scopeConditions.map((cond, index) => (
            <div
              key={cond.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
              }}
            >
              <Select
                value={cond.field}
                onChange={(value) => {
                  setScopeConditions((prev) =>
                    prev.map((c) => (c.id === cond.id ? { ...c, field: value } : c))
                  );
                }}
                style={{ width: 150 }}
                size="small"
              >
                {fieldOptions.map((f) => (
                  <Select.Option key={f} value={f}>
                    {f}
                  </Select.Option>
                ))}
              </Select>
              <Select
                value={cond.operator}
                onChange={(value) => {
                  setScopeConditions((prev) =>
                    prev.map((c) => (c.id === cond.id ? { ...c, operator: value } : c))
                  );
                }}
                style={{ width: 120 }}
                size="small"
              >
                {operatorOptions.map((o) => (
                  <Select.Option key={o} value={o}>
                    {o}
                  </Select.Option>
                ))}
              </Select>
              {cond.field === 'Last updated at' || cond.field === 'Created at' ? (
                <>
                  <Select defaultValue="指定日期" size="small" style={{ width: 100 }}>
                    <Select.Option value="指定日期">指定日期</Select.Option>
                  </Select>
                  <DatePicker size="small" style={{ flex: 1 }} />
                </>
              ) : (
                <Select style={{ flex: 1 }} size="small" placeholder="请选择">
                  <Select.Option value="">请选择</Select.Option>
                </Select>
              )}
              <Button
                type="text"
                size="small"
                danger
                onClick={() => removeCondition(cond.id)}
                icon={<span>×</span>}
              />
            </div>
          ))}
          <Button type="link" size="small" onClick={addCondition}>
            + 添加条件
          </Button>
        </div>
      </Modal>
    </PageContainer>
  );
}
