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
  Dropdown,
  Drawer,
  message,
  Empty,
  Divider,
  Typography,
  Row,
  Col,
  DatePicker,
  Tabs,
  Alert,
  List,
  Tree,
  Segmented,
} from 'antd';
import type { MenuProps } from 'antd';
import type { TableProps } from 'antd/es/table';
import type { DataNode as TreeNodeData } from 'antd/es/tree';
import type { Dayjs } from 'dayjs';
import {
  ApartmentOutlined,
  BuildOutlined,
  TeamOutlined,
  FolderOpenOutlined,
  ProjectOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  MoreOutlined,
  StopOutlined,
  PlayCircleOutlined,
  CopyOutlined,
  MergeCellsOutlined,
  ArrowRightOutlined,
  TeamOutlined as PositionsIcon,
  DownOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import PageContainer from '@/components/PageContainer';
import StatusTag from '@/components/StatusTag';
import { useOrgStore } from '@/store/orgStore';
import { usePositionStore } from '@/store/positionStore';
import { useUserStore } from '@/store/userStore';
import { useTemplateStore } from '@/store/templateStore';
import { generateOrgCode } from '@/utils/idGenerator';
import { formatDateTime } from '@/utils/dateUtils';
import type { OrgNode, OrgNodeType, Position, Template, TemplateNode } from '@/types';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const NODE_TYPE_LABELS: Record<OrgNodeType, string> = {
  GROUP: '集团',
  COMPANY: '分公司',
  DEPARTMENT: '部门',
  PROGRAM: '项目集',
  PROJECT: '项目',
};

const NODE_TYPE_ICONS: Record<OrgNodeType, React.ReactNode> = {
  GROUP: <ApartmentOutlined style={{ color: '#1890ff' }} />,
  COMPANY: <BuildOutlined style={{ color: '#52c41a' }} />,
  DEPARTMENT: <TeamOutlined style={{ color: '#722ed1' }} />,
  PROGRAM: <FolderOpenOutlined style={{ color: '#fa8c16' }} />,
  PROJECT: <ProjectOutlined style={{ color: '#eb2f96' }} />,
};

const INNER_OUTER_OPTIONS = [
  { label: '内部', value: 'INNER' },
  { label: '外部', value: 'OUTER' },
];

const ORG_TYPE_OPTIONS = [
  { label: '职能型组织架构', value: 'VERTICAL' },
  { label: '项目型组织架构', value: 'HORIZONTAL' },
];

// 根据组织架构类型获取可用的节点类型
const getNodeTypesByOrgType = (orgType: string | undefined): { value: OrgNodeType; label: string }[] => {
  if (orgType === 'VERTICAL') {
    return [
      { value: 'GROUP', label: '集团' },
      { value: 'COMPANY', label: '公司' },
      { value: 'DEPARTMENT', label: '部门' },
    ];
  }
  if (orgType === 'HORIZONTAL') {
    return [
      { value: 'PROGRAM', label: '项目集' },
      { value: 'PROJECT', label: '项目' },
    ];
  }
  return Object.entries(NODE_TYPE_LABELS).map(([value, label]) => ({ value: value as OrgNodeType, label }));
};

const ORG_SCALE_OPTIONS = [
  { label: '50人以下', value: '50以下' },
  { label: '50-100人', value: '50-100' },
  { label: '100-200人', value: '100-200' },
  { label: '200-500人', value: '200-500' },
  { label: '500-1000人', value: '500-1000' },
  { label: '1000人以上', value: '1000+' },
];

const COOPERATION_TYPE_MAP: Record<number, string> = {
  1: '项目交付方',
  2: '第三方开发',
  3: '合作伙伴',
  4: '客户',
  5: '内部开发',
};

const INDUSTRY_MAP: Record<number, string> = {
  1: '互联网',
  2: '软件开发',
  3: '贸易',
  4: '制造业',
  5: '金融',
  6: '房地产',
  7: '教育',
  8: '医疗',
};

const CONTACT_WAY_MAP: Record<number, string> = {
  1: '网上',
  2: '朋友介绍',
  3: '其他',
};

const BUSINESS_TYPE_MAP: Record<number, string> = {
  1: '软件开发',
  2: '系统集成商',
  3: '硬件厂商',
};

interface TableTreeNodeData extends OrgNode {
  key: string;
  children?: TableTreeNodeData[];
}

interface OrganizationProps {
  mode?: 'inner' | 'outer' | 'vertical' | 'horizontal';
}

export default function Organization({ mode = 'inner' }: OrganizationProps) {
  const {
    nodes,
    selectedNodeId,
    setSelectedNodeId,
    getNodeById,
    getChildren,
    getDescendants,
    getPath,
    addNode,
    updateNode,
    deleteNode,
    activateNode,
    deactivateNode,
    deriveNode,
    mergeNodes,
    moveNode,
    searchNodes,
  } = useOrgStore();

  const { getPositionsByOrgNode } = usePositionStore();
  const { users } = useUserStore();
  const { templates, getTemplatesByType } = useTemplateStore();

  const [activeTab, setActiveTab] = useState<'VERTICAL' | 'HORIZONTAL'>(
    mode === 'horizontal' ? 'HORIZONTAL' : 'VERTICAL'
  );
  const [searchValue, setSearchValue] = useState('');
  const [searchType, setSearchType] = useState<OrgNodeType | null>(null);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [searchDateRange, setSearchDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(() => {
    // 默认展开到第三级
    const keys: React.Key[] = [];
    const rootNodes = nodes.filter((n) => n.parentId === null && n.status !== 'DELETED');
    rootNodes.forEach((root) => {
      keys.push(root.id);
      const level2 = nodes.filter((n) => n.parentId === root.id && n.status !== 'DELETED');
      level2.forEach((l2) => {
        keys.push(l2.id);
        const level3 = nodes.filter((n) => n.parentId === l2.id && n.status !== 'DELETED');
        level3.forEach((l3) => keys.push(l3.id));
      });
    });
    return keys;
  });

  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deriveModalOpen, setDeriveModalOpen] = useState(false);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [positionDrawerOpen, setPositionDrawerOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const [form] = Form.useForm();
  const [deriveForm] = Form.useForm();
  const [mergeForm] = Form.useForm();
  const [moveForm] = Form.useForm();

  const [parentNodeForCreate, setParentNodeForCreate] = useState<OrgNode | null>(null);
  const [editingNode, setEditingNode] = useState<OrgNode | null>(null);
  const [derivingNode, setDerivingNode] = useState<OrgNode | null>(null);
  const [mergeSourceNode, setMergeSourceNode] = useState<OrgNode | null>(null);
  const [moveSourceNode, setMoveSourceNode] = useState<OrgNode | null>(null);
  const [detailNode, setDetailNode] = useState<OrgNode | null>(null);

  const activeNodes = useMemo(
    () => nodes.filter((n) => n.status !== 'DELETED'),
    [nodes]
  );

  const selectedNode = useMemo(
    () => (selectedNodeId ? getNodeById(selectedNodeId) : null),
    [selectedNodeId, getNodeById]
  );

  const parentNode = useMemo(
    () => (selectedNode?.parentId ? getNodeById(selectedNode.parentId) : null),
    [selectedNode, getNodeById]
  );

  const childrenNodes = useMemo(
    () => (selectedNodeId ? getChildren(selectedNodeId) : []),
    [selectedNodeId, getChildren]
  );

  const positions = useMemo(
    () => (selectedNodeId ? getPositionsByOrgNode(selectedNodeId) : []),
    [selectedNodeId, getPositionsByOrgNode]
  );

  const getNextCode = useCallback(
    (type: OrgNodeType) => {
      const prefixMap: Record<string, string> = {
        GROUP: 'GRP',
        COMPANY: 'CMP',
        DEPARTMENT: 'DEP',
        PROGRAM: 'PRG',
        PROJECT: 'PRJ',
      };
      const prefix = prefixMap[type] || 'ORG';
      const sameTypeNodes = activeNodes.filter((n) => n.type === type);
      const maxNum = sameTypeNodes.reduce((max, node) => {
        const numStr = node.code.replace(`${prefix}_`, '');
        const num = parseInt(numStr, 10);
        return num > max ? num : max;
      }, 0);
      return generateOrgCode(type, maxNum + 1);
    },
    [activeNodes]
  );

  const buildTreeTableData = useCallback(
    (
      parentId: string | null,
      keyword: string,
      type: OrgNodeType | null,
      status: string | null,
      dateRange: [Dayjs | null, Dayjs | null] | null,
      tab: 'VERTICAL' | 'HORIZONTAL',
      dataSource: OrgNode[] = activeNodes
    ): TableTreeNodeData[] => {
      const parentNode = parentId ? dataSource.find((n) => n.id === parentId) : null;

      const getValidNodeTypes = (): OrgNodeType[] => {
        if (tab === 'VERTICAL') {
          return ['GROUP', 'COMPANY', 'DEPARTMENT'];
        }
        return ['GROUP', 'COMPANY', 'PROGRAM', 'PROJECT'];
      };

      const validTypes = getValidNodeTypes();

      const buildChildren = (pid: string | null): TableTreeNodeData[] => {
        const children = dataSource
          .filter((n) => n.parentId === pid && validTypes.includes(n.type))
          .sort((a, b) => a.sort - b.sort);

        return children.map((node) => {
          const nodeChildren = buildTreeTableData(node.id, keyword, type, status, dateRange, tab, dataSource);

          const matchKeyword =
            keyword === '' ||
            node.name.toLowerCase().includes(keyword.toLowerCase()) ||
            node.code.toLowerCase().includes(keyword.toLowerCase());

          const matchType = type === null || node.type === type;

          const matchStatus = status === null || node.status === status;

          let matchDate = true;
          if (dateRange && dateRange[0] && dateRange[1]) {
            const nodeDate = new Date(node.createdAt).getTime();
            const startDate = dateRange[0].startOf('day').valueOf();
            const endDate = dateRange[1].endOf('day').valueOf();
            matchDate = nodeDate >= startDate && nodeDate <= endDate;
          }

          const hasMatch = matchKeyword && matchType && matchStatus && matchDate;

          if (!hasMatch && nodeChildren.length === 0) {
            return { ...node, key: node.id, children: [] };
          }

          return {
            ...node,
            key: node.id,
            children: nodeChildren,
          };
        }).filter((node) => {
          const matchKeyword =
            keyword === '' ||
            node.name.toLowerCase().includes(keyword.toLowerCase()) ||
            node.code.toLowerCase().includes(keyword.toLowerCase());

          const matchType = type === null || node.type === type;
          const matchStatus = status === null || node.status === status;

          let matchDate = true;
          if (dateRange && dateRange[0] && dateRange[1]) {
            const nodeDate = new Date(node.createdAt).getTime();
            const startDate = dateRange[0].startOf('day').valueOf();
            const endDate = dateRange[1].endOf('day').valueOf();
            matchDate = nodeDate >= startDate && nodeDate <= endDate;
          }

          const hasMatch = matchKeyword && matchType && matchStatus && matchDate;
          return hasMatch || (node.children && node.children.length > 0);
        });
      };

      return buildChildren(parentId);
    },
    [activeNodes]
  );

  const filteredNodes = useMemo(() => {
    if (mode === 'inner') {
      return activeNodes.filter((n) => n.innerOuter === 'INNER' || !n.innerOuter);
    }
    if (mode === 'outer') {
      return activeNodes.filter((n) => n.innerOuter === 'OUTER');
    }
    return activeNodes;
  }, [activeNodes, mode]);

  const modeActiveNodes = useMemo(() => {
    if (mode === 'vertical') {
      return activeNodes.filter((n) => ['GROUP', 'COMPANY', 'DEPARTMENT'].includes(n.type));
    }
    if (mode === 'horizontal') {
      return activeNodes.filter((n) => ['GROUP', 'COMPANY', 'PROGRAM', 'PROJECT'].includes(n.type));
    }
    return filteredNodes;
  }, [activeNodes, mode, filteredNodes]);

  const treeTableData = useMemo(() => {
    return buildTreeTableData(null, searchValue, searchType, searchStatus, searchDateRange, activeTab, modeActiveNodes);
  }, [buildTreeTableData, searchValue, searchType, searchStatus, searchDateRange, activeTab, modeActiveNodes]);

  const onSearch = (value: string) => {
    setSearchValue(value);
    if (value) {
      const matched = searchNodes(value);
      const keys: React.Key[] = [];
      matched.forEach((node) => {
        const path = getPath(node.id);
        path.slice(0, -1).forEach((p) => {
          if (!keys.includes(p.id)) {
            keys.push(p.id);
          }
        });
      });
      setExpandedKeys(keys);
    } else {
      setExpandedKeys(['org-001']);
    }
  };

  const handleReset = () => {
    setSearchValue('');
    setSearchType(null);
    setSearchStatus(null);
    setSearchDateRange(null);
    setExpandedKeys(['org-001']);
  };

  const onExpand: TableProps['onExpand'] = (expanded, record) => {
    if (expanded) {
      setExpandedKeys([...expandedKeys, record.key]);
    } else {
      setExpandedKeys(expandedKeys.filter((k) => k !== record.key));
    }
  };

  const onRowClick = (record: TableTreeNodeData) => {
    setSelectedNodeId(record.id);
    setDetailNode(record);
  };

  const canDeactivate = (nodeId: string): boolean => {
    const descendants = getDescendants(nodeId);
    return !descendants.some((d) => d.status === 'ACTIVE');
  };

  const canDelete = (nodeId: string): { canDelete: boolean; reason?: string } => {
    const node = getNodeById(nodeId);
    if (!node) return { canDelete: false, reason: '节点不存在' };
    if (!node.parentId) return { canDelete: false, reason: '根节点不允许删除' };

    const children = getChildren(nodeId);
    if (children.length > 0) {
      return { canDelete: false, reason: '存在子节点，不允许删除' };
    }

    const nodePositions = getPositionsByOrgNode(nodeId);
    if (nodePositions.length > 0) {
      return { canDelete: false, reason: '存在关联岗位，不允许删除' };
    }

    const relatedUsers = users.filter((u) => u.orgNodeId === nodeId);
    if (relatedUsers.length > 0) {
      return { canDelete: false, reason: '存在关联用户，不允许删除' };
    }

    return { canDelete: true };
  };

  const openCreateModal = (parent: OrgNode | null) => {
    setParentNodeForCreate(parent);
    form.resetFields();
    const initialType: OrgNodeType = parent
      ? (['GROUP', 'COMPANY', 'DEPARTMENT', 'PROGRAM'].includes(parent.type) ? getNextChildType(parent.type) : 'PROJECT')
      : (activeTab === 'HORIZONTAL' ? 'PROGRAM' : 'GROUP');
    let defaultInnerOuter = 'INNER';
    if (mode === 'outer') {
      defaultInnerOuter = 'OUTER';
    } else if (mode === 'vertical' || mode === 'horizontal') {
      defaultInnerOuter = parent?.innerOuter || 'INNER';
    }
    form.setFieldsValue({
      parentId: parent?.id || null,
      type: initialType,
      status: 'ACTIVE',
      innerOuter: defaultInnerOuter,
      orgType: activeTab,
    });
    setCreateModalOpen(true);
  };

  const getNextChildType = (parentType: OrgNodeType): OrgNodeType => {
    const typeOrder: OrgNodeType[] = ['GROUP', 'COMPANY', 'DEPARTMENT', 'PROGRAM', 'PROJECT'];
    const idx = typeOrder.indexOf(parentType);
    return typeOrder[Math.min(idx + 1, typeOrder.length - 1)];
  };

  const getChildNodeTypes = (parentType: OrgNodeType | null): { value: OrgNodeType; label: string }[] => {
    if (!parentType) {
      return [{ value: 'GROUP', label: '集团' }];
    }
    switch (parentType) {
      case 'GROUP':
        return [
          { value: 'COMPANY', label: '分公司' },
          { value: 'DEPARTMENT', label: '部门' },
        ];
      case 'COMPANY':
        return [{ value: 'DEPARTMENT', label: '部门' }];
      case 'DEPARTMENT':
        return [{ value: 'DEPARTMENT', label: '部门' }];
      case 'PROGRAM':
        return [{ value: 'PROJECT', label: '项目' }];
      case 'PROJECT':
        return [];
      default:
        return [];
    }
  };

  const handleCreateSubmit = async () => {
    try {
      const values = await form.validateFields();
      const code = values.code || '';
      const sort = values.sort
        ? parseInt(values.sort, 10)
        : parentNodeForCreate
        ? getChildren(parentNodeForCreate.id).length + 1
        : activeNodes.filter((n) => n.parentId === null).length + 1;

      const newNode = addNode({
        tenantId: 'tenant-001',
        code,
        name: values.name,
        parentId: parentNodeForCreate?.id || null,
        type: values.type,
        status: values.status,
        orgScale: values.orgScale,
        businessInfo: values.businessInfo,
        innerOuter: values.innerOuter,
        orgType: values.orgType,
        sort,
        remark: values.remark,
        extId: values.extId,
        orgId: values.orgId,
        cooperationType: values.cooperationType,
        industry: values.industry,
        contactWay: values.contactWay,
        phone: values.phone,
        address: values.address,
        postalCode: values.postalCode,
        businessType: values.businessType,
        requirementDesc: values.requirementDesc,
        caseDesc: values.caseDesc,
      });

      message.success('创建成功');
      setCreateModalOpen(false);
      setSelectedNodeId(newNode.id);
      if (parentNodeForCreate) {
        setExpandedKeys((prev) => [...prev, parentNodeForCreate.id]);
      }
    } catch {
      // 表单验证失败
    }
  };

  const openEditModal = (node: OrgNode) => {
    setEditingNode(node);
    form.resetFields();
    form.setFieldsValue({
      name: node.name,
      code: node.code,
      type: node.type,
      parentId: node.parentId,
      status: node.status,
      orgScale: node.orgScale,
      businessInfo: node.businessInfo,
      innerOuter: node.innerOuter,
      orgType: node.orgType,
      remark: node.remark,
      extId: node.extId,
      orgId: node.orgId,
      cooperationType: node.cooperationType,
      industry: node.industry,
      contactWay: node.contactWay,
      phone: node.phone,
      address: node.address,
      postalCode: node.postalCode,
      businessType: node.businessType,
      requirementDesc: node.requirementDesc,
      caseDesc: node.caseDesc,
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingNode) {
        const sort = values.sort ? parseInt(values.sort, 10) : editingNode.sort;
        updateNode(editingNode.id, {
          name: values.name,
          code: values.code || editingNode.code,
          status: values.status,
          orgScale: values.orgScale,
          businessInfo: values.businessInfo,
          innerOuter: values.innerOuter,
          orgType: values.orgType,
          parentId: values.parentId !== undefined ? values.parentId : editingNode.parentId,
          sort,
          remark: values.remark,
          extId: values.extId,
          orgId: values.orgId,
          cooperationType: values.cooperationType,
          industry: values.industry,
          contactWay: values.contactWay,
          phone: values.phone,
          address: values.address,
          postalCode: values.postalCode,
          businessType: values.businessType,
          requirementDesc: values.requirementDesc,
          caseDesc: values.caseDesc,
        });
        message.success('更新成功');
        setEditModalOpen(false);
      }
    } catch {
      // 表单验证失败
    }
  };

  const handleDeactivate = (node: OrgNode) => {
    const descendants = getDescendants(node.id).filter((d) => d.status === 'ACTIVE');

    Modal.confirm({
      title: '确认停用',
      content: `确定要停用「${node.name}」吗，停用后将子节点同步停用？`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        deactivateNode(node.id, true);
        // 同步更新详情抽屉中的节点状态
        if (detailNode?.id === node.id || descendants.some((d) => d.id === detailNode?.id)) {
          setDetailNode(getNodeById(detailNode?.id || node.id) || null);
        }
        message.success('停用成功');
      },
    });
  };

  const handleActivate = (node: OrgNode) => {
    const descendants = getDescendants(node.id).filter((d) => d.status === 'INACTIVE');

    Modal.confirm({
      title: '确认启用',
      content: `确定要启用「${node.name}」吗，启用后将子节点同步启用？`,
      okText: '确认启用',
      onOk: () => {
        activateNode(node.id);
        // 同步更新详情抽屉中的节点状态
        if (detailNode?.id === node.id) {
          setDetailNode({ ...detailNode, status: 'ACTIVE' });
        }
        message.success('启用成功');
      },
    });
  };

  const handleDelete = (node: OrgNode) => {
    const result = canDelete(node.id);
    if (!result.canDelete) {
      Modal.error({
        title: '无法删除',
        content: result.reason,
      });
      return;
    }

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除「${node.name}」吗？删除后数据将被移入回收站，可恢复。`,
      okText: '确认删除',
      okButtonProps: { danger: true },
      onOk: () => {
        updateNode(node.id, { status: 'DELETED' });
        if (selectedNodeId === node.id) {
          setSelectedNodeId(null);
        }
        // 如果详情抽屉打开的是当前节点，关闭抽屉
        if (detailNode?.id === node.id) {
          setDetailDrawerOpen(false);
          setDetailNode(null);
        }
        message.success('删除成功');
      },
    });
  };

  const openDeriveModal = (node: OrgNode) => {
    if (node.type !== 'DEPARTMENT') {
      message.warning('仅部门类型节点支持派生独立组织');
      return;
    }
    setDerivingNode(node);
    deriveForm.resetFields();
    deriveForm.setFieldsValue({
      newName: `${node.name}(派生)`,
      newParentId: null,
    });
    setDeriveModalOpen(true);
  };

  const handleDeriveSubmit = async () => {
    try {
      const values = await deriveForm.validateFields();
      if (derivingNode) {
        deriveNode(derivingNode.id, values.newName, values.newParentId);
        message.success('派生成功');
        setDeriveModalOpen(false);
      }
    } catch {
      // 表单验证失败
    }
  };

  const openMergeModal = (node: OrgNode) => {
    setMergeSourceNode(node);
    mergeForm.resetFields();
    mergeForm.setFieldsValue({
      sourceId: node.id,
      targetId: null,
      newNodeName: '',
    });
    setMergeModalOpen(true);
  };

  const handleMergeSubmit = async () => {
    try {
      const values = await mergeForm.validateFields();
      if (!mergeSourceNode) return;

      const targetNode = getNodeById(values.targetId);
      if (!targetNode) {
        message.error('目标节点不存在');
        return;
      }

      // 更新目标节点名称为新名称
      updateNode(targetNode.id, { name: values.newNodeName });

      // 将源节点的子节点迁移到目标节点下
      const sourceChildren = getChildren(mergeSourceNode.id);
      sourceChildren.forEach((child) => {
        moveNode(child.id, targetNode.id);
      });

      // 删除源节点
      updateNode(mergeSourceNode.id, { status: 'DELETED' });

      message.success('合并成功');
      setMergeModalOpen(false);
      setSelectedNodeId(targetNode.id);
      setExpandedKeys((prev) => [...prev, targetNode.id]);
    } catch {
      // 表单验证失败
    }
  };

  const openMoveModal = (node: OrgNode) => {
    setMoveSourceNode(node);
    moveForm.resetFields();
    moveForm.setFieldsValue({
      nodeId: node.id,
      targetParentId: null,
    });
    setMoveModalOpen(true);
  };

  const handleCreateFromTemplate = (template: Template) => {
    if (!template.nodes || template.nodes.length === 0) {
      message.warning('该模版没有节点数据');
      return;
    }

    const orgType = template.templateMode || 'VERTICAL';
    const idMap = new Map<string, string>();
    const targetParentId = selectedNode?.id || null;

    const createNodeFromTemplate = (
      templateNode: TemplateNode,
      parentId: string | null
    ): string => {
      const newId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      idMap.set(templateNode.id, newId);

      addNode({
        id: newId,
        tenantId: 'tenant-001',
        code: generateOrgCode(templateNode.nodeType, Date.now()),
        name: templateNode.nodeName,
        parentId,
        type: templateNode.nodeType,
        status: 'ACTIVE',
        orgType,
        innerOuter: 'INNER',
        sort: templateNode.sort,
      } as OrgNode);

      if (templateNode.children && templateNode.children.length > 0) {
        templateNode.children.forEach((child) => {
          createNodeFromTemplate(child, newId);
        });
      }

      return newId;
    };

    const rootTemplateNodes = template.nodes.filter((n) => !n.parentId || n.parentNodeName === '根节点');
    rootTemplateNodes.forEach((rootNode) => {
      if (rootNode.children && rootNode.children.length > 0) {
        rootNode.children.forEach((child) => {
          createNodeFromTemplate(child, targetParentId);
        });
      }
    });

    message.success('组织架构创建成功');
    setTemplateModalOpen(false);
    if (targetParentId) {
      setExpandedKeys((prev) => [...prev, targetParentId, ...Array.from(idMap.values())]);
    } else {
      setExpandedKeys((prev) => [...prev, ...Array.from(idMap.values())]);
    }
  };

  const orgTemplates = useMemo(() => {
    return getTemplatesByType('ORG').filter(
      (t) => t.status === 'PUBLISHED' && t.templateMode === activeTab
    );
  }, [getTemplatesByType, activeTab]);

  const buildTemplateTreeData = useCallback((template: Template): TreeNodeData[] => {
    const nodeTypeLabels: Record<string, string> = {
      GROUP: '集团',
      COMPANY: '分公司',
      DEPARTMENT: '部门',
      PROGRAM: '项目集',
      PROJECT: '项目',
    };
    const nodeTypeColors: Record<string, string> = {
      GROUP: '#722ed1',
      COMPANY: '#1677ff',
      DEPARTMENT: '#52c41a',
      PROGRAM: '#fa8c16',
      PROJECT: '#eb2f96',
    };

    const buildNode = (n: TemplateNode): TreeNodeData => ({
      key: n.id,
      title: (
        <Space size={4}>
          <Tag color={nodeTypeColors[n.nodeType] || 'default'} style={{ fontSize: 11, margin: 0 }}>
            {nodeTypeLabels[n.nodeType] || n.nodeType}
          </Tag>
          <span>{n.nodeName}</span>
          {n.nodeCode && <span style={{ color: '#999', fontSize: 12 }}>({n.nodeCode})</span>}
        </Space>
      ),
      children: n.children?.map(buildNode),
    });

    const rootNodes = template.nodes?.filter((n) => !n.parentId || n.parentNodeName === '根节点') || [];
    return rootNodes.map(buildNode);
  }, []);

  const validateMoveRule = (nodeId: string, targetParentId: string | null): { valid: boolean; reason?: string } => {
    const node = getNodeById(nodeId);
    if (!node) return { valid: false, reason: '节点不存在' };

    if (targetParentId === null) {
      return { valid: true };
    }

    const targetParent = getNodeById(targetParentId);
    if (!targetParent) return { valid: false, reason: '目标父节点不存在' };

    if (targetParent.type === 'COMPANY' && node.type === 'GROUP') {
      return { valid: false, reason: '分公司下不能挂载集团节点' };
    }

    if (targetParent.type === 'PROJECT' && node.type === 'PROGRAM') {
      return { valid: false, reason: '项目下不能挂载项目集节点' };
    }

    const descendants = getDescendants(nodeId);
    if (descendants.some((d) => d.id === targetParentId)) {
      return { valid: false, reason: '不能将节点移动到自身的子节点下' };
    }

    return { valid: true };
  };

  const handleMoveSubmit = async () => {
    try {
      const values = await moveForm.validateFields();
      const result = validateMoveRule(values.nodeId, values.targetParentId);
      if (!result.valid) {
        Modal.error({
          title: '无法迁移',
          content: result.reason,
        });
        return;
      }

      moveNode(values.nodeId, values.targetParentId);
      message.success('迁移成功');
      setMoveModalOpen(false);
    } catch {
      // 表单验证失败
    }
  };

  const openPositionDrawer = (node: OrgNode) => {
    setSelectedNodeId(node.id);
    setPositionDrawerOpen(true);
  };

  const getContextMenuItems = (node: OrgNode): MenuProps['items'] => [
    {
      key: 'create',
      icon: <PlusOutlined />,
      label: '创建子节点',
      onClick: () => openCreateModal(node),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: '编辑',
      onClick: () => openEditModal(node),
    },
    {
      key: 'toggleStatus',
      icon: node.status === 'ACTIVE' ? <StopOutlined /> : <PlayCircleOutlined />,
      label: node.status === 'ACTIVE' ? '停用' : '启用',
      onClick: () => {
        if (node.status === 'ACTIVE') {
          handleDeactivate(node);
        } else {
          handleActivate(node);
        }
      },
    },
    { type: 'divider' },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
      danger: true,
      onClick: () => handleDelete(node),
    },
    { type: 'divider' },
    {
      key: 'derive',
      icon: <CopyOutlined />,
      label: '派生独立组织',
      onClick: () => openDeriveModal(node),
    },
    {
      key: 'merge',
      icon: <MergeCellsOutlined />,
      label: '合并组织节点',
      onClick: () => openMergeModal(node),
    },
    {
      key: 'move',
      icon: <ArrowRightOutlined />,
      label: '迁移组织节点',
      onClick: () => openMoveModal(node),
    },
    { type: 'divider' },
    {
      key: 'positions',
      icon: <PositionsIcon />,
      label: '查询关联岗位',
      onClick: () => openPositionDrawer(node),
    },
  ];

  const getMoreMenuItems = (node: OrgNode): MenuProps['items'] => {
    // 合并/迁移/关联岗位菜单项：仅部门或项目类型展示
    const isMergeMoveVisible = node.type === 'DEPARTMENT' || node.type === 'PROJECT';

    const items: MenuProps['items'] = [
      {
        key: 'create',
        icon: <PlusOutlined />,
        label: '创建子节点',
        onClick: () => openCreateModal(node),
      },
      {
        key: 'toggleStatus',
        icon: node.status === 'ACTIVE' ? <StopOutlined /> : <PlayCircleOutlined />,
        label: node.status === 'ACTIVE' ? '停用' : '启用',
        danger: node.status === 'ACTIVE',
        onClick: () => {
          if (node.status === 'ACTIVE') {
            handleDeactivate(node);
          } else {
            handleActivate(node);
          }
        },
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除',
        danger: true,
        onClick: () => handleDelete(node),
      },
      { type: 'divider' },
      {
        key: 'derive',
        icon: <CopyOutlined />,
        label: '派生独立组织',
        onClick: () => openDeriveModal(node),
        disabled: node.type !== 'DEPARTMENT',
      },
    ];

    if (isMergeMoveVisible) {
      items.push(
        {
          key: 'merge',
          icon: <MergeCellsOutlined />,
          label: '合并组织节点',
          onClick: () => openMergeModal(node),
        },
        {
          key: 'move',
          icon: <ArrowRightOutlined />,
          label: '迁移组织节点',
          onClick: () => openMoveModal(node),
        },
        {
          key: 'positions',
          icon: <PositionsIcon />,
          label: '查询关联岗位',
          onClick: () => openPositionDrawer(node),
        }
      );
    }

    return items;
  };

  const treeTableColumns = [
    {
      title: '节点名称',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (text: string, record: TableTreeNodeData) => (
        <Space>
          {NODE_TYPE_ICONS[record.type]}
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '节点类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: OrgNodeType) => (
        <Tag color="blue">{NODE_TYPE_LABELS[type]}</Tag>
      ),
    },
    {
      title: '节点状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <StatusTag
          status={status === 'ACTIVE' ? 'active' : 'inactive'}
          text={status === 'ACTIVE' ? '启用' : '停用'}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '显示排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 100,
      render: (sort: number) => sort || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_, record: TableTreeNodeData) => (
        <Space size="small">
          <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); setDetailNode(record); setDetailDrawerOpen(true); }}>
            查看
          </Button>
          <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); openEditModal(record); }}>
            编辑
          </Button>
          <Dropdown 
            menu={{ items: getMoreMenuItems(record) }}
            trigger={['click']}
          >
            <Button type="link" size="small" onClick={(e) => e.stopPropagation()}>更多 <DownOutlined /></Button>
          </Dropdown>
        </Space>
      ),
    },
  ];

  const positionColumns = [
    {
      title: '岗位编码',
      dataIndex: 'code',
      key: 'code',
      width: 150,
    },
    {
      title: '岗位名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <StatusTag
          status={status === 'ACTIVE' ? 'active' : 'inactive'}
          text={status === 'ACTIVE' ? '启用' : '停用'}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: () => (
        <Space size="small">
          <Button type="link" size="small">查看</Button>
        </Space>
      ),
    },
  ];

  const orgSelectOptions = useMemo(() => {
    const buildOptions = (parentId: string | null, level: number): any[] => {
      const children = activeNodes
        .filter((n) => n.parentId === parentId)
        .sort((a, b) => a.sort - b.sort);
      return children.flatMap((node) => [
        {
          label: `${'　'.repeat(level)}${node.name}`,
          value: node.id,
        },
        ...buildOptions(node.id, level + 1),
      ]);
    };
    return buildOptions(null, 0);
  }, [activeNodes]);

  const pageTitle = useMemo(() => {
    const titleMap = {
      inner: '内部组织架构',
      outer: '外部组织架构',
      vertical: '职能型组织架构',
      horizontal: '项目型组织架构',
    };
    return titleMap[mode];
  }, [mode]);

  const queryNodeTypes = useMemo(() => {
    if (mode === 'vertical') {
      return [{ value: 'GROUP', label: '集团' }, { value: 'COMPANY', label: '公司' }, { value: 'DEPARTMENT', label: '部门' }];
    }
    if (mode === 'horizontal') {
      return [{ value: 'PROGRAM', label: '项目集' }, { value: 'PROJECT', label: '项目' }];
    }
    if (mode === 'outer') {
      return [{ value: 'GROUP', label: '集团' }, { value: 'COMPANY', label: '公司' }, { value: 'DEPARTMENT', label: '部门' }];
    }
    return getNodeTypesByOrgType(activeTab);
  }, [mode, activeTab]);

  return (
    <PageContainer title={`${pageTitle}管理`} subTitle={`管理${pageTitle}、部门、岗位等信息`}>
      <Card>
        {mode === 'inner' ? (
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as 'VERTICAL' | 'HORIZONTAL')}
            style={{ marginBottom: 16 }}
            items={[
              {
                key: 'VERTICAL',
                label: '职能型组织架构',
              },
              {
                key: 'HORIZONTAL',
                label: '项目型组织架构',
              },
            ]}
          />
        ) : null}

        <Form layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item label="节点名称">
            <Input
              placeholder="请输入节点名称"
              allowClear
              style={{ width: 200 }}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="节点类型">
            <Select
              placeholder="请选择节点类型"
              allowClear
              style={{ width: 150 }}
              value={searchType}
              onChange={(value) => setSearchType(value)}
            >
              {queryNodeTypes.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="节点状态">
            <Select
              placeholder="请选择节点状态"
              allowClear
              style={{ width: 120 }}
              value={searchStatus}
              onChange={(value) => setSearchStatus(value)}
            >
              <Option value="ACTIVE">启用</Option>
              <Option value="INACTIVE">停用</Option>
            </Select>
          </Form.Item>
          <Form.Item label="创建时间">
            <RangePicker
              style={{ width: 260 }}
              value={searchDateRange}
              onChange={(dates) => setSearchDateRange(dates as [Dayjs | null, Dayjs | null] | null)}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                type="primary"
                onClick={() => {
                  if (searchValue) {
                    const matched = searchNodes(searchValue);
                    const keys: React.Key[] = [];
                    matched.forEach((node) => {
                      const path = getPath(node.id);
                      path.slice(0, -1).forEach((p) => {
                        if (!keys.includes(p.id)) {
                          keys.push(p.id);
                        }
                      });
                    });
                    setExpandedKeys(keys);
                  }
                }}
              >
                查询
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Space>
            <span>{pageTitle}</span>
            <Tag color="green">{modeActiveNodes.length}</Tag>
          </Space>
          <Space>
            <Segmented
              value={viewMode}
              onChange={(value) => setViewMode(value as 'table' | 'chart')}
              options={[
                { label: '列表视图', value: 'table' },
                { label: '组织架构图', value: 'chart' },
              ]}
            />
            {mode === 'inner' && (
              <Button
                size="small"
                icon={<FileTextOutlined />}
                onClick={() => setTemplateModalOpen(true)}
              >
                使用模版创建
              </Button>
            )}
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => openCreateModal(null)}
            >
              新建
            </Button>
          </Space>
        </div>

        {viewMode === 'table' ? (
          treeTableData.length > 0 ? (
            <Table<TableTreeNodeData>
              dataSource={treeTableData}
              columns={treeTableColumns}
              rowKey="id"
              size="middle"
              pagination={false}
              defaultExpandAllRows
              expandedRowKeys={expandedKeys}
              onExpand={onExpand}
              scroll={{ x: 1000 }}
              onRow={(record) => ({
                onClick: () => onRowClick(record),
                style: {
                  cursor: 'pointer',
                  backgroundColor: record.id === selectedNodeId ? '#e6f7ff' : undefined,
                },
              })}
            />
          ) : (
            <Empty description="暂无数据" style={{ marginTop: 60 }} />
          )
        ) : (
          <div style={{ padding: 24, minHeight: 500, overflow: 'auto' }}>
            {treeTableData.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {treeTableData.map((root, rootIdx) => (
                  <div key={root.id} style={{ marginBottom: 40 }}>
                    <div
                      style={{
                        padding: '12px 24px',
                        background: selectedNodeId === root.id ? '#e6f7ff' : '#fff',
                        border: `2px solid ${selectedNodeId === root.id ? '#1677ff' : '#d9d9d9'}`,
                        borderRadius: 8,
                        cursor: 'pointer',
                        minWidth: 160,
                        textAlign: 'center',
                        fontWeight: 500,
                      }}
                      onClick={() => onRowClick(root)}
                    >
                      {root.name}
                      <Tag color="blue" style={{ marginLeft: 8 }}>
                        {NODE_TYPE_LABELS[root.type]}
                      </Tag>
                    </div>
                    {root.children && root.children.length > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20, gap: 24 }}>
                        {root.children.map((child) => (
                          <div key={child.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div
                              style={{
                                padding: '10px 20px',
                                background: selectedNodeId === child.id ? '#e6f7ff' : '#f9f9f9',
                                border: `1px solid ${selectedNodeId === child.id ? '#1677ff' : '#d9d9d9'}`,
                                borderRadius: 6,
                                cursor: 'pointer',
                                minWidth: 140,
                                textAlign: 'center',
                              }}
                              onClick={() => onRowClick(child)}
                            >
                              {child.name}
                              <Tag color="green" style={{ marginLeft: 6, fontSize: 11 }}>
                                {NODE_TYPE_LABELS[child.type]}
                              </Tag>
                            </div>
                            {child.children && child.children.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 16, gap: 12 }}>
                                {child.children.map((grandchild) => (
                                  <div
                                    key={grandchild.id}
                                    style={{
                                      padding: '8px 16px',
                                      background: selectedNodeId === grandchild.id ? '#e6f7ff' : '#fff',
                                      border: `1px solid ${selectedNodeId === grandchild.id ? '#1677ff' : '#e8e8e8'}`,
                                      borderRadius: 4,
                                      cursor: 'pointer',
                                      minWidth: 120,
                                      textAlign: 'center',
                                      fontSize: 13,
                                    }}
                                    onClick={() => onRowClick(grandchild)}
                                  >
                                    {grandchild.name}
                                    <Tag color="purple" style={{ marginLeft: 4, fontSize: 10 }}>
                                      {NODE_TYPE_LABELS[grandchild.type]}
                                    </Tag>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="暂无数据" style={{ marginTop: 60 }} />
            )}
          </div>
        )}
      </Card>

      {mode === 'inner' && activeTab === 'VERTICAL' && (
        <Card title="组织架构规则说明" style={{ marginTop: 16 }}>
          <Table
            columns={[
              { title: '功能模块', dataIndex: 'module', key: 'module', width: 120 },
              { title: '功能点', dataIndex: 'point', key: 'point', width: 140 },
              { title: '功能描述', dataIndex: 'description', key: 'description' },
              { title: '适用范围', dataIndex: 'scope', key: 'scope', width: 120 },
            ]}
            dataSource={[
              {
                key: '1',
                module: '组织架构',
                point: '创建组织节点',
                description: '1. 租户ID、节点ID自动生成且不可编辑\n2. 同一组织下组织节点编码、名称不可重复\n3. 组织架构层级挂载职能型组织架构：[集团 -> 分公司 -> 部门]，分公司下禁止挂载集团\n4. 横向组织架构：[项目集 -> 项目]，项目下禁止挂载项目集',
                scope: '组织聚合',
              },
              {
                key: '2',
                module: '组织架构',
                point: '编辑组织节点',
                description: '租户ID、节点ID不允许修改，同一组织下组织节点名称、编码不可重复',
                scope: '组织聚合',
              },
              {
                key: '3',
                module: '组织架构',
                point: '停用组织节点',
                description: '1. 允许启用、删除、编辑、详情、查询关联岗位\n2. 停用：状态更新为"停用"，关联子节点同步停用',
                scope: '组织聚合',
              },
              {
                key: '4',
                module: '组织架构',
                point: '启用组织节点',
                description: '1. 允许创建子节点，编辑、停用、删除，派生独立组织、合并、迁移，查询关联岗位\n2. 启用：状态更新为启用，关联子节点同步启用',
                scope: '组织聚合',
              },
              {
                key: '5',
                module: '组织架构',
                point: '删除组织节点',
                description: '删除节点前必须无子节点、无岗位、无关联用户，根节点不允许删除，删除后允许恢复删除',
                scope: '组织聚合',
              },
              {
                key: '6',
                module: '组织架构',
                point: '恢复删除',
                description: '恢复删除状态更新为"启用"',
                scope: '组织聚合',
              },
              {
                key: '7',
                module: '组织架构',
                point: '派生独立组织',
                description: '组织节点类型（部门）复制创建新组织结构，挂载到根节点',
                scope: '组织聚合',
              },
              {
                key: '8',
                module: '组织架构',
                point: '合并组织节点规则',
                description: '选择源组织节点ID与目标组织节点ID，填写合并后新组织节点，合并后源节点及关联子节点ID更新岗位关联合并后的节点ID',
                scope: '组织聚合',
              },
              {
                key: '9',
                module: '组织架构',
                point: '迁移组织节点',
                description: '选择组织节点类型（部门）及下级节点迁移到其他节点下，更新归属节点ID',
                scope: '组织聚合',
              },
              {
                key: '10',
                module: '组织架构',
                point: '查询关联岗位',
                description: '组织节点ID查询关联岗位列表',
                scope: '组织聚合',
              },
              {
                key: '11',
                module: '组织架构',
                point: '使用模版创建',
                description: '1. 根节点=集团，仅可选用模板类型=集团类型，用于生成下级组织架构\n2. 节点类型=分公司，仅可选用模板类型=分公司类型，节点下无任何子节点允许使用「分公司类型」模板创建子结构\n3. 所有模板根节点为虚拟节点，仅作架构生成载体，不落地保存至组织节点树',
                scope: '组织聚合',
              },
            ]}
            pagination={false}
            size="small"
            scroll={{ x: 1200 }}
          />
        </Card>
      )}

      {/* 创建模态框 */}
      <Modal
        title="创建组织节点"
        open={createModalOpen}
        onOk={handleCreateSubmit}
        onCancel={() => setCreateModalOpen(false)}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="节点名称"
                name="name"
                rules={[{ required: true, message: '请输入节点名称' }]}
              >
                <Input placeholder="请输入节点名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="节点编码"
                name="code"
              >
                <Input placeholder="请输入节点编码（可留空）" allowClear />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="组织架构类型"
                name="orgType"
                rules={[{ required: true, message: '请选择组织架构类型' }]}
              >
                <Select placeholder="请选择组织架构类型" disabled>
                  {ORG_TYPE_OPTIONS.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="状态"
                name="status"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态">
                  <Option value="ACTIVE">启用</Option>
                  <Option value="INACTIVE">停用</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item noStyle>
            {() => {
              const parentType = parentNodeForCreate?.type || null;
              let nodeTypes = getChildNodeTypes(parentType);
              if (mode === 'outer') {
                nodeTypes = [
                  { value: 'GROUP', label: '集团' },
                  { value: 'COMPANY', label: '公司' },
                  { value: 'DEPARTMENT', label: '部门' },
                ];
              }
              return (
                <Form.Item
                  label="节点类型"
                  name="type"
                  rules={[{ required: true, message: '请选择节点类型' }]}
                >
                  <Select placeholder="请选择节点类型">
                    {nodeTypes.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              );
            }}
          </Form.Item>
          <Form.Item label="上级节点" name="parentId">
            <Select
              placeholder="根节点（无上级）"
              allowClear
              showSearch
              optionFilterProp="label"
              options={orgSelectOptions}
            />
          </Form.Item>
          <Form.Item label="显示排序" name="sort">
            <Input placeholder="请输入显示排序（可留空）" allowClear />
          </Form.Item>
          {(mode === 'vertical' || mode === 'horizontal') && (
            <Form.Item label="内外归属" name="innerOuter">
              <Select placeholder="请选择">
                {INNER_OUTER_OPTIONS.map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.type !== cur.type}>
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              // 职能型：集团、公司时展示扩展信息；部门不展示
              // 项目型：项目集、项目都不展示扩展信息
              if (type === 'GROUP' || type === 'COMPANY') {
                return (
                  <>
                    <Divider style={{ margin: '16px 0' }} />
                    <Title level={5}>扩展信息</Title>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="组织规模" name="orgScale">
                          <Select placeholder="请选择组织规模" allowClear>
                            {ORG_SCALE_OPTIONS.map((opt) => (
                              <Option key={opt.value} value={opt.value}>
                                {opt.label}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="业务类型" name="businessType">
                          <Select placeholder="请选择业务类型" allowClear>
                            {Object.entries(BUSINESS_TYPE_MAP).map(([value, label]) => (
                              <Option key={value} value={parseInt(value)}>
                                {label}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="合作类型" name="cooperationType">
                          <Select placeholder="请选择合作类型" allowClear>
                            {Object.entries(COOPERATION_TYPE_MAP).map(([value, label]) => (
                              <Option key={value} value={parseInt(value)}>
                                {label}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="所属行业" name="industry">
                          <Select placeholder="请选择所属行业" allowClear>
                            {Object.entries(INDUSTRY_MAP).map(([value, label]) => (
                              <Option key={value} value={parseInt(value)}>
                                {label}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="接触途径" name="contactWay">
                          <Select placeholder="请选择接触途径" allowClear>
                            {Object.entries(CONTACT_WAY_MAP).map(([value, label]) => (
                              <Option key={value} value={parseInt(value)}>
                                {label}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="主建ID" name="extId">
                          <Input placeholder="请输入主建ID" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="联系电话" name="phone">
                          <Input placeholder="请输入联系电话" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="邮政编码" name="postalCode">
                          <Input placeholder="请输入邮政编码" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="联系地址" name="address">
                          <Input placeholder="请输入联系地址" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item label="需求描述" name="requirementDesc">
                      <Input.TextArea rows={3} placeholder="请输入需求描述" />
                    </Form.Item>
                    <Form.Item label="案例说明" name="caseDesc">
                      <Input.TextArea rows={3} placeholder="请输入案例说明" />
                    </Form.Item>
                    <Form.Item label="业务扩展信息" name="businessInfo">
                      <Input.TextArea rows={3} placeholder="请输入业务扩展信息" />
                    </Form.Item>
                    <Form.Item label="备注" name="remark">
                      <Input.TextArea rows={2} placeholder="请输入备注" />
                    </Form.Item>
                  </>
                );
              }
              return null;
            }}
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑模态框 */}
      <Modal
        title="编辑组织节点"
        open={editModalOpen}
        onOk={handleEditSubmit}
        onCancel={() => setEditModalOpen(false)}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="节点名称"
                name="name"
                rules={[{ required: true, message: '请输入节点名称' }]}
              >
                <Input placeholder="请输入节点名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="节点编码"
                name="code"
              >
                <Input placeholder="请输入节点编码（可留空）" allowClear />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="组织架构类型"
                name="orgType"
              >
                <Select placeholder="请选择组织架构类型" disabled>
                  {ORG_TYPE_OPTIONS.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="节点类型">
                <Input value={editingNode ? NODE_TYPE_LABELS[editingNode.type] : ''} disabled />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="上级节点" name="parentId">
                <Select
                  placeholder="根节点"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={activeNodes
                    .filter((n) => n.parentId === null)
                    .map((n) => ({ label: n.name, value: n.id }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="状态"
                name="status"
              >
                <Select placeholder="请选择状态">
                  <Option value="ACTIVE">启用</Option>
                  <Option value="INACTIVE">停用</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="显示排序" name="sort">
                <Input type="number" placeholder="请输入排序号" />
              </Form.Item>
            </Col>
          </Row>
          {(mode === 'vertical' || mode === 'horizontal') && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="内外归属" name="innerOuter">
                  <Select placeholder="请选择">
                    {INNER_OUTER_OPTIONS.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
          {(editingNode?.type === 'GROUP' || editingNode?.type === 'COMPANY') && (
            <>
              <Divider style={{ margin: '16px 0' }} />
              <Title level={5}>扩展信息</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="组织规模" name="orgScale">
                    <Select placeholder="请选择组织规模" allowClear>
                      {ORG_SCALE_OPTIONS.map((opt) => (
                        <Option key={opt.value} value={opt.value}>
                          {opt.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="业务类型" name="businessType">
                    <Select placeholder="请选择业务类型" allowClear>
                      {Object.entries(BUSINESS_TYPE_MAP).map(([value, label]) => (
                        <Option key={value} value={parseInt(value)}>
                          {label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="合作类型" name="cooperationType">
                    <Select placeholder="请选择合作类型" allowClear>
                      {Object.entries(COOPERATION_TYPE_MAP).map(([value, label]) => (
                        <Option key={value} value={parseInt(value)}>
                          {label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="所属行业" name="industry">
                    <Select placeholder="请选择所属行业" allowClear>
                      {Object.entries(INDUSTRY_MAP).map(([value, label]) => (
                        <Option key={value} value={parseInt(value)}>
                          {label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="接触途径" name="contactWay">
                    <Select placeholder="请选择接触途径" allowClear>
                      {Object.entries(CONTACT_WAY_MAP).map(([value, label]) => (
                        <Option key={value} value={parseInt(value)}>
                          {label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="联系电话" name="phone">
                    <Input placeholder="请输入联系电话" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="邮政编码" name="postalCode">
                    <Input placeholder="请输入邮政编码" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="主建ID" name="extId">
                    <Input placeholder="请输入主建ID" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="联系地址" name="address">
                <Input.TextArea rows={2} placeholder="请输入联系地址" />
              </Form.Item>
              <Form.Item label="需求描述" name="requirementDesc">
                <Input.TextArea rows={3} placeholder="请输入需求描述" />
              </Form.Item>
              <Form.Item label="案例说明" name="caseDesc">
                <Input.TextArea rows={3} placeholder="请输入案例说明" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      {/* 派生独立组织模态框 */}
      <Modal
        title="派生独立组织"
        open={deriveModalOpen}
        onOk={handleDeriveSubmit}
        onCancel={() => setDeriveModalOpen(false)}
        width={500}
        destroyOnClose
      >
        <Form form={deriveForm} layout="vertical">
          <Form.Item label="源组织">
            <Input value={derivingNode?.name} disabled />
          </Form.Item>
          <Form.Item
            label="新组织名称"
            name="newName"
            rules={[{ required: true, message: '请输入新组织名称' }]}
          >
            <Input placeholder="请输入新组织名称" />
          </Form.Item>
          <Form.Item label="挂载到" name="newParentId">
            <Select
              placeholder="根节点"
              allowClear
              showSearch
              optionFilterProp="label"
              options={activeNodes
                .filter((n) => n.parentId === null)
                .map((n) => ({ label: n.name, value: n.id }))}
            />
          </Form.Item>
          <div style={{ color: '#999', fontSize: 12 }}>
            提示：派生组织将复制源组织及其所有子级结构，编码将自动添加 _D 后缀
          </div>
        </Form>
      </Modal>

      {/* 合并组织模态框 */}
      <Modal
        title="合并组织节点"
        open={mergeModalOpen}
        onOk={handleMergeSubmit}
        onCancel={() => setMergeModalOpen(false)}
        width={500}
        destroyOnClose
      >
        <Form form={mergeForm} layout="vertical">
          <Form.Item label="源节点">
            <Input value={mergeSourceNode?.name} disabled />
          </Form.Item>
          <Form.Item
            label="目标节点"
            name="targetId"
            rules={[{ required: true, message: '请选择目标节点' }]}
          >
            <Select
              placeholder="请选择目标节点"
              showSearch
              optionFilterProp="label"
              options={orgSelectOptions}
            />
          </Form.Item>
          <Form.Item
            label="新组织节点名称"
            name="newNodeName"
            rules={[{ required: true, message: '请输入新组织节点名称' }]}
          >
            <Input placeholder="请输入合并后的新组织节点名称" />
          </Form.Item>
          <div style={{ color: '#999', fontSize: 12 }}>
            提示：合并后将创建新组织节点，源节点和目标节点将作为子节点挂到新节点下
          </div>
        </Form>
      </Modal>

      {/* 迁移组织模态框 */}
      <Modal
        title="迁移组织节点"
        open={moveModalOpen}
        onOk={handleMoveSubmit}
        onCancel={() => setMoveModalOpen(false)}
        width={500}
        destroyOnClose
      >
        <Form form={moveForm} layout="vertical">
          <Form.Item label="迁移节点">
            <Input value={moveSourceNode?.name} disabled />
          </Form.Item>
          <Form.Item
            label="目标父节点"
            name="targetParentId"
            rules={[{ required: true, message: '请选择目标父节点' }]}
          >
            <Select
              placeholder="请选择目标父节点"
              showSearch
              optionFilterProp="label"
              options={orgSelectOptions}
            />
          </Form.Item>
          <div style={{ color: '#999', fontSize: 12 }}>
            提示：确认后原节点将迁移到目标节点下
          </div>
        </Form>
      </Modal>

      {/* 使用模版创建组织架构模态框 */}
      <Modal
        title="使用模版创建组织架构"
        open={templateModalOpen}
        onCancel={() => {
          setTemplateModalOpen(false);
          setPreviewTemplate(null);
          setSelectedTemplate(null);
        }}
        width={900}
        destroyOnClose
        footer={
          <Space>
            <Button onClick={() => {
              setTemplateModalOpen(false);
              setPreviewTemplate(null);
              setSelectedTemplate(null);
            }}>
              取消
            </Button>
            <Button
              type="primary"
              disabled={!previewTemplate}
              onClick={() => {
                if (previewTemplate) {
                  handleCreateFromTemplate(previewTemplate);
                  setPreviewTemplate(null);
                  setSelectedTemplate(null);
                }
              }}
            >
              使用模版创建
            </Button>
          </Space>
        }
      >
        <div style={{ display: 'flex', gap: 16, minHeight: 400 }}>
          {/* 左侧模版列表 */}
          <div style={{ width: 360, flexShrink: 0, overflow: 'auto', maxHeight: 480 }}>
            <div style={{ marginBottom: 12, fontWeight: 500, color: '#333' }}>
              选择组织架构模版
            </div>
            {orgTemplates.length === 0 ? (
              <Empty description="暂无可用的组织架构模版" />
            ) : (
              <List
                dataSource={orgTemplates}
                renderItem={(template) => (
                  <List.Item
                    key={template.id}
                    style={{
                      padding: '12px',
                      border: '1px solid #f0f0f0',
                      borderRadius: 8,
                      marginBottom: 10,
                      cursor: 'pointer',
                      background: previewTemplate?.id === template.id ? '#e6f4ff' : '#fff',
                      borderColor: previewTemplate?.id === template.id ? '#1677ff' : '#f0f0f0',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => {
                      setPreviewTemplate(template);
                      setSelectedTemplate(template);
                    }}
                  >
                    <List.Item.Meta
                      avatar={<ApartmentOutlined style={{ fontSize: 20, color: '#1677ff' }} />}
                      title={
                        <Space>
                          <span style={{ fontWeight: 500, fontSize: 13 }}>{template.name}</span>
                          <Tag color={template.templateMode === 'VERTICAL' ? 'blue' : 'purple'} style={{ fontSize: 10 }}>
                            {template.templateMode === 'VERTICAL' ? '职能型' : '项目型'}
                          </Tag>
                        </Space>
                      }
                      description={
                        <div style={{ fontSize: 12, color: '#999' }}>
                          {template.code} | {template.nodes?.length || 0} 个节点
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </div>

          {/* 右侧预览面板 */}
          <div style={{ flex: 1, borderLeft: '1px solid #f0f0f0', paddingLeft: 16, overflow: 'auto', maxHeight: 480 }}>
            {previewTemplate ? (
              <>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 4 }}>
                    {previewTemplate.name}
                  </div>
                  <Space size={8}>
                    <Tag color={previewTemplate.templateMode === 'VERTICAL' ? 'blue' : 'purple'}>
                      {previewTemplate.templateMode === 'VERTICAL' ? '职能型' : '项目型'}
                    </Tag>
                    <span style={{ color: '#999', fontSize: 12 }}>
                      模版编码：{previewTemplate.code}
                    </span>
                    <span style={{ color: '#999', fontSize: 12 }}>
                      版本：{previewTemplate.version}
                    </span>
                  </Space>
                </div>
                {previewTemplate.content && (
                  <div style={{ marginBottom: 12, color: '#666', fontSize: 12, lineHeight: 1.6 }}>
                    {previewTemplate.content}
                  </div>
                )}
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ fontWeight: 500, marginBottom: 12, color: '#333' }}>
                  组织架构预览
                </div>
                <Tree
                  treeData={buildTemplateTreeData(previewTemplate)}
                  defaultExpandAll
                  showLine
                  blockNode
                />
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Empty description="请从左侧选择模版进行预览" />
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* 详情抽屉 */}
      <Drawer
        title="组织节点详情"
        placement="right"
        width={700}
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        extra={
          detailNode ? (
            <Space>
              <Tag color="blue">{NODE_TYPE_LABELS[detailNode.type]}</Tag>
              <StatusTag
                status={detailNode.status === 'ACTIVE' ? 'active' : 'inactive'}
                text={detailNode.status === 'ACTIVE' ? '启用' : '停用'}
              />
            </Space>
          ) : null
        }
      >
        {detailNode && (
          <div style={{ padding: 16 }}>
            {(detailNode.type === 'GROUP' || detailNode.type === 'COMPANY') ? (
              <>
                <Card type="inner" title="基础信息">
                  <Row gutter={24}>
                    <Col span={8}>
                      <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">租户ID</Text>
                        <div style={{ marginTop: 4, fontWeight: 500 }}>{detailNode.tenantId}</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">节点ID</Text>
                        <div style={{ marginTop: 4, fontWeight: 500 }}>{detailNode.id}</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">节点编码</Text>
                        <div style={{ marginTop: 4, fontWeight: 500 }}>{detailNode.code}</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">上级节点ID</Text>
                        <div style={{ marginTop: 4, fontWeight: 500 }}>
                          {detailNode.parentId || '-'}
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">上级节点名称</Text>
                        <div style={{ marginTop: 4, fontWeight: 500 }}>
                          {detailNode.parentId ? getNodeById(detailNode.parentId)?.name || '-' : '根节点'}
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">节点名称</Text>
                        <div style={{ marginTop: 4, fontWeight: 500 }}>{detailNode.name}</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">组织架构类型</Text>
                        <div style={{ marginTop: 4, fontWeight: 500 }}>
                          {detailNode.orgType === 'VERTICAL'
                            ? '职能型组织架构'
                            : detailNode.orgType === 'HORIZONTAL'
                            ? '项目型组织架构'
                            : '-'}
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">节点类型</Text>
                        <div style={{ marginTop: 4, fontWeight: 500 }}>
                          <Tag color="blue">{NODE_TYPE_LABELS[detailNode.type]}</Tag>
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">内外归属</Text>
                        <div style={{ marginTop: 4, fontWeight: 500 }}>
                          {detailNode.innerOuter === 'INNER' ? '内部' : detailNode.innerOuter === 'OUTER' ? '外部' : '-'}
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">显示排序</Text>
                        <div style={{ marginTop: 4, fontWeight: 500 }}>{detailNode.sort}</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">创建时间</Text>
                        <div style={{ marginTop: 4, fontWeight: 500 }}>{formatDateTime(detailNode.createdAt)}</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">更新时间</Text>
                        <div style={{ marginTop: 4, fontWeight: 500 }}>{formatDateTime(detailNode.updatedAt)}</div>
                      </div>
                    </Col>
                    <Col span={24}>
                      <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">备注</Text>
                        <div style={{ marginTop: 4, fontWeight: 500 }}>
                          {detailNode.remark || '-'}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card>

                <Divider style={{ margin: '16px 0' }} />
                <Card type="inner" title="扩展信息" style={{ marginTop: 16 }}>
                  <Row gutter={24}>
                    <Col span={8}>
                      <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">组织规模</Text>
                        <div style={{ marginTop: 4, fontWeight: 500 }}>
                          {detailNode.orgScale || '-'}
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">业务类型</Text>
                        <div style={{ marginTop: 4, fontWeight: 500 }}>
                          {detailNode.businessType ? BUSINESS_TYPE_MAP[detailNode.businessType] : '-'}
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">合作类型</Text>
                        <div style={{ marginTop: 4, fontWeight: 500 }}>
                          {detailNode.cooperationType ? COOPERATION_TYPE_MAP[detailNode.cooperationType] : '-'}
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">所属行业</Text>
                        <div style={{ marginTop: 4, fontWeight: 500 }}>
                          {detailNode.industry ? INDUSTRY_MAP[detailNode.industry] : '-'}
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">接触途径</Text>
                        <div style={{ marginTop: 4, fontWeight: 500 }}>
                          {detailNode.contactWay ? CONTACT_WAY_MAP[detailNode.contactWay] : '-'}
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">联系电话</Text>
                        <div style={{ marginTop: 4, fontWeight: 500 }}>{detailNode.phone || '-'}</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">邮政编码</Text>
                        <div style={{ marginTop: 4, fontWeight: 500 }}>{detailNode.postalCode || '-'}</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">主建ID</Text>
                        <div style={{ marginTop: 4, fontWeight: 500 }}>{detailNode.extId || '-'}</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">关联节点ID</Text>
                        <div style={{ marginTop: 4, fontWeight: 500 }}>{detailNode.orgId || '-'}</div>
                      </div>
                    </Col>
                    <Col span={24}>
                      <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">联系地址</Text>
                        <div style={{ marginTop: 4, fontWeight: 500 }}>{detailNode.address || '-'}</div>
                      </div>
                    </Col>
                    <Col span={24}>
                      <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">需求描述</Text>
                        <div style={{ marginTop: 4, fontWeight: 500 }}>
                          {detailNode.requirementDesc || '-'}
                        </div>
                      </div>
                    </Col>
                    <Col span={24}>
                      <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">案例说明</Text>
                        <div style={{ marginTop: 4, fontWeight: 500 }}>
                          {detailNode.caseDesc || '-'}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </>
            ) : (
              <Card type="inner" title="基础信息">
                <Row gutter={24}>
                  <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                      <Text type="secondary">节点名称</Text>
                      <div style={{ marginTop: 4, fontWeight: 500 }}>{detailNode.name}</div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                      <Text type="secondary">节点编码</Text>
                      <div style={{ marginTop: 4, fontWeight: 500 }}>{detailNode.code}</div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                      <Text type="secondary">上级节点ID</Text>
                      <div style={{ marginTop: 4, fontWeight: 500 }}>
                        {detailNode.parentId || '-'}
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                      <Text type="secondary">节点类型</Text>
                      <div style={{ marginTop: 4, fontWeight: 500 }}>
                        <Tag color="blue">{NODE_TYPE_LABELS[detailNode.type]}</Tag>
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                      <Text type="secondary">显示排序</Text>
                      <div style={{ marginTop: 4, fontWeight: 500 }}>{detailNode.sort}</div>
                    </div>
                  </Col>
                  <Col span={24}>
                    <div style={{ marginBottom: 16 }}>
                      <Text type="secondary">备注</Text>
                      <div style={{ marginTop: 4, fontWeight: 500 }}>
                        {detailNode.remark || '-'}
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>
            )}
          </div>
        )}
      </Drawer>

      {/* 关联岗位抽屉 */}
      <Drawer
        title="关联岗位列表"
        placement="right"
        width={700}
        open={positionDrawerOpen}
        onClose={() => setPositionDrawerOpen(false)}
        extra={
          <Space>
            <span style={{ color: '#999' }}>
              共 {positions.length} 个岗位
            </span>
          </Space>
        }
      >
        {selectedNode && (
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">组织节点：</Text>
            <Space>
              {NODE_TYPE_ICONS[selectedNode.type]}
              <span style={{ fontWeight: 500 }}>{selectedNode.name}</span>
            </Space>
          </div>
        )}
        <Table
          dataSource={positions}
          columns={positionColumns}
          rowKey="id"
          size="middle"
          pagination={false}
        />
      </Drawer>
    </PageContainer>
  );
}
