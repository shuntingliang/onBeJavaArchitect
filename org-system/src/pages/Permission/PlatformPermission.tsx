import { useState, useMemo, useCallback } from 'react';
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
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import {
  SearchOutlined,
  SafetyCertificateOutlined,
  AppstoreOutlined,
  MenuOutlined,
  TeamOutlined,
  UserOutlined,
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

type LeftTabType = 'functionSet' | 'position';

export default function PlatformPermission() {
  const { functionSets, updateFunctionSet } = useFunctionSetStore();
  const { getTree, getFlatList } = useResourceStore();
  const { getTree: getOrgTree } = useOrgStore();
  const { positions } = usePositionStore();
  const { users } = useUserStore();

  const [leftTab, setLeftTab] = useState<LeftTabType>('functionSet');
  const [keyword, setKeyword] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('function');
  const [positionOrgType, setPositionOrgType] = useState<'VERTICAL' | 'HORIZONTAL'>('VERTICAL');

  const [checkedResourceKeys, setCheckedResourceKeys] = useState<React.Key[]>([]);

  const [dataScope, setDataScope] = useState<string>('DEPT');
  const [selectedDeptIds, setSelectedDeptIds] = useState<React.Key[]>([]);

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

  const filterTreeByOrgType = useCallback((tree: DataNode[], orgType: 'VERTICAL' | 'HORIZONTAL'): DataNode[] => {
    const orgNodes = getOrgTree();
    const getNodeOrgType = (key: string): string | undefined => {
      const findNode = (nodes: any[]): any => {
        for (const node of nodes) {
          if (node.id === key) return node;
          if (node.children) {
            const found = findNode(node.children);
            if (found) return found;
          }
        }
        return null;
      };
      const found = findNode(orgNodes as any[]);
      return found?.orgType;
    };

    const filter = (nodes: DataNode[]): DataNode[] => {
      return nodes
        .map((node) => {
          const nodeOrgType = getNodeOrgType(node.key as string);
          const filteredChildren = node.children ? filter(node.children) : [];
          if (nodeOrgType === orgType || filteredChildren.length > 0) {
            return {
              ...node,
              children: filteredChildren.length > 0 ? filteredChildren : node.children,
            };
          }
          return null;
        })
        .filter(Boolean) as DataNode[];
    };
    return filter(tree);
  }, [getOrgTree]);

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

  const buildPositionTree = useMemo<DataNode[]>(() => {
    const filteredTree = filterTreeByOrgType(orgTreeData, positionOrgType);
    const addPositionsToNodes = (nodes: DataNode[]): DataNode[] => {
      return nodes.map((node) => {
        const nodePositions = positions.filter(
          (p) => p.orgNodeId === node.key && p.status === 'ACTIVE'
        );
        const positionChildren: DataNode[] = nodePositions.map((p) => ({
          title: p.name,
          key: p.id,
          isLeaf: true,
        }));
        const childNodes = node.children ? addPositionsToNodes(node.children) : [];
        return {
          ...node,
          children: [...childNodes, ...positionChildren],
        };
      });
    };
    return addPositionsToNodes(filteredTree);
  }, [orgTreeData, positions, positionOrgType, filterTreeByOrgType]);

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
            title: u.name,
            key: u.id,
            isLeaf: true,
          }));
          return {
            title: p.name,
            key: p.id,
            children: userChildren,
          };
        });
        const childNodes = node.children ? addUsersToNodes(node.children) : [];
        return {
          ...node,
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
        <div>
          <Tabs
            activeKey={positionOrgType}
            onChange={(key) => { setPositionOrgType(key as 'VERTICAL' | 'HORIZONTAL'); setSelectedId(null); }}
            size="small"
            style={{ padding: '0 12px' }}
            items={[
              { key: 'VERTICAL', label: '职能型' },
              { key: 'HORIZONTAL', label: '项目型' },
            ]}
          />
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
        </div>
      );
    }
    return (
      <div style={{ padding: '0 8px' }}>
        <Tree
          treeData={buildUserTree}
          selectedKeys={selectedId ? [selectedId] : []}
          onSelect={(keys) => {
            const key = keys[0] as string;
            if (key && users.some((u) => u.id === key)) {
              handleSelectItem(key);
            }
          }}
          defaultExpandAll
        />
      </div>
    );
  };

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
              maxHeight: 'calc(100vh - 320px)',
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
      key: 'data',
      label: (
        <span>
          <SafetyCertificateOutlined /> 数据权限
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>数据范围</div>
            <Radio.Group value={dataScope} onChange={(e) => setDataScope(e.target.value)} style={{ width: '100%' }}>
              <Space direction="vertical">
                {dataScopeOptions.map((opt) => (
                  <Radio key={opt.value} value={opt.value}>{opt.label}</Radio>
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

          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button type="primary" onClick={handleSaveDataPermission}>保存</Button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <PageContainer title="平台权限配置" subTitle="配置平台级权限">
      <Row gutter={16} style={{ height: 'calc(100vh - 140px)' }}>
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
                <SafetyCertificateOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <div>请在左侧选择职能集/岗位/用户进行权限配置</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
}
