import { useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Form,
  Input,
  InputNumber,
  Checkbox,
  Switch,
  Radio,
  Modal,
  Select,
  message,
  Dropdown,
  theme,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  StopOutlined,
  EyeOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import PageContainer from '@/components/PageContainer';
import { useSecurityStore } from '@/store/securityStore';
import type { PasswordPolicy, LockRule, OrgNodeStatus, LockUnit } from '@/types';
import { formatDateTime } from '@/utils/dateUtils';

const { Option } = Select;

interface PasswordPolicyFormValues {
  name: string;
  minLength: number;
  maxLength: number;
  charTypes: string[];
  noIncludeUsername: boolean;
  noConsecutiveLetters: boolean;
  noConsecutiveNumbers: boolean;
  status: OrgNodeStatus;
}

interface LockRuleFormValues {
  name: string;
  failThreshold: number;
  lockDuration: number;
  lockUnit: LockUnit;
  status: OrgNodeStatus;
}

const charTypeOptions = [
  { label: '大写字母', value: 'upper' },
  { label: '小写字母', value: 'lower' },
  { label: '数字', value: 'number' },
  { label: '特殊字符', value: 'special' },
];

const lockUnitOptions = [
  { label: '分钟', value: 'MINUTE' },
  { label: '小时', value: 'HOUR' },
  { label: '天', value: 'DAY' },
];

export default function PolicyPage() {
  const { token } = theme.useToken();
  const {
    passwordPolicies,
    lockRules,
    activePasswordPolicyId,
    activeLockRuleId,
    setActivePasswordPolicy,
    setActiveLockRule,
    addPasswordPolicy,
    updatePasswordPolicy,
    deletePasswordPolicy,
    activatePasswordPolicy,
    deactivatePasswordPolicy,
    addLockRule,
    updateLockRule,
    deleteLockRule,
    activateLockRule,
    deactivateLockRule,
  } = useSecurityStore();

  const [activeTab, setActiveTab] = useState('password');
  const [passwordForm] = Form.useForm<PasswordPolicyFormValues>();
  const [lockForm] = Form.useForm<LockRuleFormValues>();

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordModalType, setPasswordModalType] = useState<'add' | 'edit'>('add');
  const [editingPasswordPolicy, setEditingPasswordPolicy] = useState<PasswordPolicy | null>(null);

  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [lockModalType, setLockModalType] = useState<'add' | 'edit'>('add');
  const [editingLockRule, setEditingLockRule] = useState<LockRule | null>(null);

  const selectedPasswordPolicy = passwordPolicies.find((p) => p.id === activePasswordPolicyId);
  const selectedLockRule = lockRules.find((r) => r.id === activeLockRuleId);

  const policyToFormValues = (policy: PasswordPolicy): PasswordPolicyFormValues => {
    const charTypes: string[] = [];
    if (policy.requireUpper) charTypes.push('upper');
    if (policy.requireLower) charTypes.push('lower');
    if (policy.requireNumber) charTypes.push('number');
    if (policy.requireSpecial) charTypes.push('special');
    return {
      name: policy.name,
      minLength: policy.minLength,
      maxLength: policy.maxLength,
      charTypes,
      noIncludeUsername: !policy.includeUsername,
      noConsecutiveLetters: policy.noConsecutiveLetters,
      noConsecutiveNumbers: policy.noConsecutiveNumbers,
      status: policy.status,
    };
  };

  const formValuesToPolicy = (values: PasswordPolicyFormValues): Omit<PasswordPolicy, 'id' | 'createdAt' | 'updatedAt'> => ({
    name: values.name,
    minLength: values.minLength,
    maxLength: values.maxLength,
    requireUpper: values.charTypes.includes('upper'),
    requireLower: values.charTypes.includes('lower'),
    requireNumber: values.charTypes.includes('number'),
    requireSpecial: values.charTypes.includes('special'),
    includeUsername: !values.noIncludeUsername,
    noConsecutiveLetters: values.noConsecutiveLetters,
    noConsecutiveNumbers: values.noConsecutiveNumbers,
    status: values.status,
  });

  const handleAddPasswordPolicy = () => {
    setPasswordModalType('add');
    setEditingPasswordPolicy(null);
    passwordForm.resetFields();
    passwordForm.setFieldsValue({
      minLength: 8,
      maxLength: 20,
      charTypes: [],
      noIncludeUsername: false,
      noConsecutiveLetters: false,
      noConsecutiveNumbers: false,
      status: 'ACTIVE',
    });
    setPasswordModalOpen(true);
  };

  const handleEditPasswordPolicy = (policy: PasswordPolicy) => {
    setPasswordModalType('edit');
    setEditingPasswordPolicy(policy);
    passwordForm.setFieldsValue(policyToFormValues(policy));
    setPasswordModalOpen(true);
  };

  const handlePasswordModalOk = async () => {
    try {
      const values = await passwordForm.validateFields();

      if (values.minLength > values.maxLength) {
        message.error('最小长度不能大于最大长度');
        return;
      }

      const policyData = formValuesToPolicy(values);

      if (passwordModalType === 'add') {
        const newPolicy = addPasswordPolicy(policyData);
        setActivePasswordPolicy(newPolicy.id);
        message.success('密码策略创建成功');
      } else if (editingPasswordPolicy) {
        updatePasswordPolicy(editingPasswordPolicy.id, policyData);
        message.success('密码策略更新成功');
      }

      setPasswordModalOpen(false);
    } catch {
      // 表单验证失败
    }
  };

  const handleDeletePasswordPolicy = (policy: PasswordPolicy) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除密码策略 "${policy.name}" 吗？`,
      okText: '确认删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        deletePasswordPolicy(policy.id);
        message.success('密码策略已删除');
      },
    });
  };

  const handleTogglePasswordStatus = (policy: PasswordPolicy) => {
    const isActive = policy.status === 'ACTIVE';
    Modal.confirm({
      title: isActive ? '确认停用' : '确认启用',
      content: `确定要${isActive ? '停用' : '启用'}密码策略 "${policy.name}" 吗？`,
      okText: `确认${isActive ? '停用' : '启用'}`,
      cancelText: '取消',
      onOk: () => {
        if (isActive) {
          deactivatePasswordPolicy(policy.id);
          message.success('密码策略已停用');
        } else {
          activatePasswordPolicy(policy.id);
          message.success('密码策略已启用');
        }
      },
    });
  };

  const handleAddLockRule = () => {
    setLockModalType('add');
    setEditingLockRule(null);
    lockForm.resetFields();
    lockForm.setFieldsValue({
      failThreshold: 5,
      lockDuration: 30,
      lockUnit: 'MINUTE',
      status: 'ACTIVE',
    });
    setLockModalOpen(true);
  };

  const handleEditLockRule = (rule: LockRule) => {
    setLockModalType('edit');
    setEditingLockRule(rule);
    lockForm.setFieldsValue({
      name: rule.name,
      failThreshold: rule.failThreshold,
      lockDuration: rule.lockDuration,
      lockUnit: rule.lockUnit,
      status: rule.status,
    });
    setLockModalOpen(true);
  };

  const handleLockModalOk = async () => {
    try {
      const values = await lockForm.validateFields();

      if (lockModalType === 'add') {
        const newRule = addLockRule({
          name: values.name,
          failThreshold: values.failThreshold,
          lockDuration: values.lockDuration,
          lockUnit: values.lockUnit,
          status: values.status,
        });
        setActiveLockRule(newRule.id);
        message.success('锁定规则创建成功');
      } else if (editingLockRule) {
        updateLockRule(editingLockRule.id, {
          name: values.name,
          failThreshold: values.failThreshold,
          lockDuration: values.lockDuration,
          lockUnit: values.lockUnit,
          status: values.status,
        });
        message.success('锁定规则更新成功');
      }

      setLockModalOpen(false);
    } catch {
      // 表单验证失败
    }
  };

  const handleDeleteLockRule = (rule: LockRule) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除锁定规则 "${rule.name}" 吗？`,
      okText: '确认删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        deleteLockRule(rule.id);
        message.success('锁定规则已删除');
      },
    });
  };

  const handleToggleLockStatus = (rule: LockRule) => {
    const isActive = rule.status === 'ACTIVE';
    Modal.confirm({
      title: isActive ? '确认停用' : '确认启用',
      content: `确定要${isActive ? '停用' : '启用'}锁定规则 "${rule.name}" 吗？`,
      okText: `确认${isActive ? '停用' : '启用'}`,
      cancelText: '取消',
      onOk: () => {
        if (isActive) {
          deactivateLockRule(rule.id);
          message.success('锁定规则已停用');
        } else {
          activateLockRule(rule.id);
          message.success('锁定规则已启用');
        }
      },
    });
  };

  const getCharacterTypesSummary = (policy: PasswordPolicy) => {
    const types: string[] = [];
    if (policy.requireUpper) types.push('大写');
    if (policy.requireLower) types.push('小写');
    if (policy.requireNumber) types.push('数字');
    if (policy.requireSpecial) types.push('特殊字符');
    return types.length > 0 ? types.join('、') : '无要求';
  };

  const getLockUnitText = (unit: LockUnit) => {
    const map: Record<LockUnit, string> = {
      MINUTE: '分钟',
      HOUR: '小时',
      DAY: '天',
    };
    return map[unit];
  };

  const PasswordPolicyList = () => {
    const columns = [
      {
        title: '策略名称',
        dataIndex: 'name',
        key: 'name',
        width: 200,
        ellipsis: true,
      },
      {
        title: '策略状态',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (status: string) => (
          <Tag color={status === 'ACTIVE' ? 'green' : 'default'}>
            {status === 'ACTIVE' ? '有效' : '无效'}
          </Tag>
        ),
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 200,
        render: (date: string) => formatDateTime(date),
      },
      {
        title: '操作',
        key: 'actions',
        width: 180,
        render: (_: any, record: PasswordPolicy) => (
          <Space size={4}>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditPasswordPolicy(record)}
            >
              编辑
            </Button>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'toggle',
                    icon: record.status === 'ACTIVE' ? <StopOutlined /> : <PlayCircleOutlined />,
                    label: record.status === 'ACTIVE' ? '停用' : '启用',
                    onClick: () => handleTogglePasswordStatus(record),
                  },
                  {
                    key: 'delete',
                    icon: <DeleteOutlined />,
                    label: '删除',
                    danger: true,
                    onClick: () => handleDeletePasswordPolicy(record),
                  },
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
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 500, fontSize: 16 }}>策略列表</div>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddPasswordPolicy}>
            新建策略
          </Button>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {passwordPolicies.length === 0 ? (
            <Empty description="暂无密码策略" style={{ marginTop: 40 }} />
          ) : (
            <Table
              dataSource={passwordPolicies}
              columns={columns}
              rowKey="id"
              size="small"
              pagination={false}
            />
          )}
        </div>
      </div>
    );
  };

  const PasswordPolicyDetail = () => {
    if (!selectedPasswordPolicy) {
      return (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Empty description="请选择一个密码策略" />
        </div>
      );
    }

    return (
      <div>
        <div style={{ marginBottom: 20, fontWeight: 500, fontSize: 16 }}>策略配置</div>
        <Form layout="vertical">
          <Form.Item label="策略名称">
            <Input value={selectedPasswordPolicy.name} disabled />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="最小长度" style={{ flex: 1 }}>
              <InputNumber value={selectedPasswordPolicy.minLength} min={1} max={128} style={{ width: '100%' }} disabled />
            </Form.Item>
            <Form.Item label="最大长度" style={{ flex: 1 }}>
              <InputNumber value={selectedPasswordPolicy.maxLength} min={1} max={128} style={{ width: '100%' }} disabled />
            </Form.Item>
          </div>
          <Form.Item label="必须包含字符类型">
            <Checkbox.Group
              value={[
                selectedPasswordPolicy.requireUpper && 'upper',
                selectedPasswordPolicy.requireLower && 'lower',
                selectedPasswordPolicy.requireNumber && 'number',
                selectedPasswordPolicy.requireSpecial && 'special',
              ].filter(Boolean) as string[]}
              disabled
            >
              <Checkbox value="upper">大写字母</Checkbox>
              <Checkbox value="lower">小写字母</Checkbox>
              <Checkbox value="number">数字</Checkbox>
              <Checkbox value="special">特殊字符</Checkbox>
            </Checkbox.Group>
          </Form.Item>
          <Form.Item label="不能包含用户名">
            <Switch checked={!selectedPasswordPolicy.includeUsername} disabled />
          </Form.Item>
          <Form.Item label="不能连续字母">
            <Switch checked={selectedPasswordPolicy.noConsecutiveLetters} disabled />
          </Form.Item>
          <Form.Item label="不能连续数字">
            <Switch checked={selectedPasswordPolicy.noConsecutiveNumbers} disabled />
          </Form.Item>
          <Form.Item label="状态">
            <Tag color={selectedPasswordPolicy.status === 'ACTIVE' ? 'green' : 'default'}>
              {selectedPasswordPolicy.status === 'ACTIVE' ? '有效' : '无效'}
            </Tag>
          </Form.Item>
          <Space style={{ marginTop: 16 }}>
            <Button type="primary" icon={<EditOutlined />} onClick={() => handleEditPasswordPolicy(selectedPasswordPolicy)}>
              编辑
            </Button>
            <Button
              icon={selectedPasswordPolicy.status === 'ACTIVE' ? <StopOutlined /> : <PlayCircleOutlined />}
              onClick={() => handleTogglePasswordStatus(selectedPasswordPolicy)}
            >
              {selectedPasswordPolicy.status === 'ACTIVE' ? '停用' : '启用'}
            </Button>
          </Space>
        </Form>
      </div>
    );
  };

  const LockRuleList = () => {
    const columns = [
      {
        title: '策略名称',
        dataIndex: 'name',
        key: 'name',
        width: 200,
        ellipsis: true,
      },
      {
        title: '策略状态',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (status: string) => (
          <Tag color={status === 'ACTIVE' ? 'green' : 'default'}>
            {status === 'ACTIVE' ? '有效' : '无效'}
          </Tag>
        ),
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 200,
        render: (date: string) => formatDateTime(date),
      },
      {
        title: '操作',
        key: 'actions',
        width: 180,
        render: (_: any, record: LockRule) => (
          <Space size={4}>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditLockRule(record)}
            >
              编辑
            </Button>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'toggle',
                    icon: record.status === 'ACTIVE' ? <StopOutlined /> : <PlayCircleOutlined />,
                    label: record.status === 'ACTIVE' ? '停用' : '启用',
                    onClick: () => handleToggleLockStatus(record),
                  },
                  {
                    key: 'delete',
                    icon: <DeleteOutlined />,
                    label: '删除',
                    danger: true,
                    onClick: () => handleDeleteLockRule(record),
                  },
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
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 500, fontSize: 16 }}>规则列表</div>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddLockRule}>
            新建规则
          </Button>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {lockRules.length === 0 ? (
            <Empty description="暂无锁定规则" style={{ marginTop: 40 }} />
          ) : (
            <Table
              dataSource={lockRules}
              columns={columns}
              rowKey="id"
              size="small"
              pagination={false}
            />
          )}
        </div>
      </div>
    );
  };

  const LockRuleDetail = () => {
    if (!selectedLockRule) {
      return (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Empty description="请选择一个锁定规则" />
        </div>
      );
    }

    return (
      <div>
        <div style={{ marginBottom: 20, fontWeight: 500, fontSize: 16 }}>规则配置</div>
        <Form layout="vertical">
          <Form.Item label="规则名称">
            <Input value={selectedLockRule.name} disabled />
          </Form.Item>
          <Form.Item label="失败次数阈值">
            <InputNumber value={selectedLockRule.failThreshold} min={1} max={100} style={{ width: '100%' }} disabled />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="锁定时长" style={{ flex: 1 }}>
              <InputNumber value={selectedLockRule.lockDuration} min={1} max={1000} style={{ width: '100%' }} disabled />
            </Form.Item>
            <Form.Item label="锁定单位" style={{ flex: 1 }}>
              <Select value={selectedLockRule.lockUnit} disabled style={{ width: '100%' }}>
                {lockUnitOptions.map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <Form.Item label="状态">
            <Tag color={selectedLockRule.status === 'ACTIVE' ? 'green' : 'default'}>
              {selectedLockRule.status === 'ACTIVE' ? '有效' : '无效'}
            </Tag>
          </Form.Item>
          <Space style={{ marginTop: 16 }}>
            <Button type="primary" icon={<EditOutlined />} onClick={() => handleEditLockRule(selectedLockRule)}>
              编辑
            </Button>
            <Button
              icon={selectedLockRule.status === 'ACTIVE' ? <StopOutlined /> : <PlayCircleOutlined />}
              onClick={() => handleToggleLockStatus(selectedLockRule)}
            >
              {selectedLockRule.status === 'ACTIVE' ? '停用' : '启用'}
            </Button>
          </Space>
        </Form>
      </div>
    );
  };

  return (
    <PageContainer title="安全策略" subTitle="管理密码策略和账号锁定规则">
      <Card
        tabList={[
          { key: 'password', tab: '密码策略' },
          { key: 'lock', tab: '锁定规则' },
        ]}
        activeTabKey={activeTab}
        onTabChange={setActiveTab}
        bodyStyle={{ padding: 0 }}
      >
        {activeTab === 'password' && (
          <div style={{ padding: 16, height: 'calc(100vh - 280px)', minHeight: 500 }}>
            <PasswordPolicyList />
          </div>
        )}
        {activeTab === 'lock' && (
          <div style={{ padding: 16, height: 'calc(100vh - 280px)', minHeight: 500 }}>
            <LockRuleList />
          </div>
        )}
      </Card>

      <Modal
        title={passwordModalType === 'add' ? '新建密码策略' : '编辑密码策略'}
        open={passwordModalOpen}
        onOk={handlePasswordModalOk}
        onCancel={() => setPasswordModalOpen(false)}
        okText="保存"
        cancelText="取消"
        width={560}
        destroyOnClose
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            label="策略名称"
            name="name"
            rules={[{ required: true, message: '请输入策略名称' }]}
          >
            <Input placeholder="请输入策略名称" maxLength={50} />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              label="最小长度"
              name="minLength"
              rules={[{ required: true, message: '请输入最小长度' }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={1} max={128} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              label="最大长度"
              name="maxLength"
              rules={[{ required: true, message: '请输入最大长度' }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={1} max={128} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item
            label="必须包含字符类型"
            name="charTypes"
            rules={[{ type: 'array', message: '请选择字符类型' }]}
          >
            <Checkbox.Group options={charTypeOptions} />
          </Form.Item>
          <Form.Item label="不能包含用户名" name="noIncludeUsername" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="不能连续字母" name="noConsecutiveLetters" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="不能连续数字" name="noConsecutiveNumbers" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Radio.Group>
              <Radio value="ACTIVE">有效</Radio>
              <Radio value="INACTIVE">无效</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={lockModalType === 'add' ? '新建锁定规则' : '编辑锁定规则'}
        open={lockModalOpen}
        onOk={handleLockModalOk}
        onCancel={() => setLockModalOpen(false)}
        okText="保存"
        cancelText="取消"
        width={480}
        destroyOnClose
      >
        <Form form={lockForm} layout="vertical">
          <Form.Item
            label="规则名称"
            name="name"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="请输入规则名称" maxLength={50} />
          </Form.Item>
          <Form.Item
            label="失败次数阈值"
            name="failThreshold"
            rules={[{ required: true, message: '请输入失败次数阈值' }]}
          >
            <InputNumber min={1} max={100} style={{ width: '100%' }} addonAfter="次" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              label="锁定时长"
              name="lockDuration"
              rules={[{ required: true, message: '请输入锁定时长' }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={1} max={1000} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              label="锁定单位"
              name="lockUnit"
              rules={[{ required: true, message: '请选择锁定单位' }]}
              style={{ flex: 1 }}
            >
              <Select style={{ width: '100%' }}>
                {lockUnitOptions.map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <Form.Item label="状态" name="status">
            <Radio.Group>
              <Radio value="ACTIVE">有效</Radio>
              <Radio value="INACTIVE">无效</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}
