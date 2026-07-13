import { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Input,
  Select,
  DatePicker,
  Space,
  Tag,
  Drawer,
  Descriptions,
  message,
  Form,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  LoginOutlined,
  LogoutOutlined,
  UserOutlined,
  LockOutlined,
  SafetyOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import PageContainer from '@/components/PageContainer';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { formatDateTime } from '@/utils/dateUtils';
import dayjs from 'dayjs';
import type { AuthLog, AuthLogType, AuthLogStatus, User } from '@/types';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface SearchFilters {
  username?: string;
  type?: AuthLogType | '';
  status?: AuthLogStatus | '';
  startTime?: string;
  endTime?: string;
}

export default function AuditPage() {
  const { logs, getLogs } = useAuthStore();
  const { users } = useUserStore();

  const [filters, setFilters] = useState<SearchFilters>({
    username: '',
    type: '',
    status: '',
    startTime: dayjs().subtract(7, 'day').startOf('day').toISOString(),
    endTime: dayjs().endOf('day').toISOString(),
  });
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(filters);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuthLog | null>(null);

  const filteredLogs = useMemo(() => {
    return getLogs({
      username: appliedFilters.username || undefined,
      type: (appliedFilters.type as AuthLogType) || undefined,
      status: (appliedFilters.status as AuthLogStatus) || undefined,
      startTime: appliedFilters.startTime,
      endTime: appliedFilters.endTime,
    });
  }, [getLogs, appliedFilters]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const statistics = useMemo(() => {
    const today = dayjs().startOf('day');
    const todayLogs = logs.filter((l) => dayjs(l.createdAt) >= today);
    const todayLoginSuccess = todayLogs.filter(
      (l) => l.type === 'LOGIN' && l.status === 'SUCCESS'
    ).length;
    const todayLoginFail = todayLogs.filter(
      (l) => l.type === 'LOGIN' && l.status === 'FAIL'
    ).length;

    const activeUsers = new Set(
      todayLogs.filter((l) => l.status === 'SUCCESS').map((l) => l.userId)
    ).size;

    const lockedUsers = users.filter((u: User) => u.status === 'LOCKED').length;

    return {
      todayLogin: todayLoginSuccess,
      todayFail: todayLoginFail,
      activeUsers,
      lockedUsers,
    };
  }, [logs, users]);

  const getDeviceInfo = (userAgent: string) => {
    if (userAgent.includes('Windows')) return 'Windows PC';
    if (userAgent.includes('Mac')) return 'Mac';
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('Linux')) return 'Linux';
    return '未知设备';
  };

  const getBrowserInfo = (userAgent: string) => {
    if (userAgent.includes('Chrome') || userAgent.includes('AppleWebKit')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    return '未知浏览器';
  };

  const handleSearch = () => {
    setAppliedFilters(filters);
    setCurrentPage(1);
  };

  const handleReset = () => {
    const defaultFilters: SearchFilters = {
      username: '',
      type: '',
      status: '',
      startTime: dayjs().subtract(7, 'day').startOf('day').toISOString(),
      endTime: dayjs().endOf('day').toISOString(),
    };
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setCurrentPage(1);
  };

  const handleViewDetail = (log: AuthLog) => {
    setSelectedLog(log);
    setDetailDrawerOpen(true);
  };

  const statusTagMap: Record<AuthLogStatus, { color: string; text: string }> = {
    SUCCESS: { color: 'green', text: '成功' },
    FAIL: { color: 'red', text: '失败' },
  };

  const typeTagMap: Record<AuthLogType, { color: string; text: string }> = {
    LOGIN: { color: 'blue', text: '登录' },
    LOGOUT: { color: 'default', text: '登出' },
  };

  const columns: ColumnsType<AuthLog> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 140,
    },
    {
      title: '认证类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: AuthLogType) => (
        <Tag color={typeTagMap[type].color} icon={type === 'LOGIN' ? <LoginOutlined /> : <LogoutOutlined />}>
          {typeTagMap[type].text}
        </Tag>
      ),
    },
    {
      title: '认证状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: AuthLogStatus) => (
        <Tag color={statusTagMap[status].color}>
          {statusTagMap[status].text}
        </Tag>
      ),
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 150,
    },
    {
      title: '失败原因',
      dataIndex: 'failReason',
      key: 'failReason',
      width: 150,
      render: (failReason?: string) => failReason || '-',
    },
    {
      title: '认证时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: 'descend',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <PageContainer title="认证记录" subTitle="查看和管理用户认证日志">
      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline">
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="用户名" style={{ marginBottom: 0, width: '100%' }}>
                <Input
                  placeholder="请输入用户名"
                  prefix={<UserOutlined />}
                  value={filters.username}
                  onChange={(e) => setFilters({ ...filters, username: e.target.value })}
                  allowClear
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Form.Item label="认证类型" style={{ marginBottom: 0, width: '100%' }}>
                <Select
                  placeholder="全部"
                  value={filters.type}
                  onChange={(value) => setFilters({ ...filters, type: value })}
                  allowClear
                  style={{ width: '100%' }}
                >
                  <Option value="">全部</Option>
                  <Option value="LOGIN">登录</Option>
                  <Option value="LOGOUT">登出</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Form.Item label="认证状态" style={{ marginBottom: 0, width: '100%' }}>
                <Select
                  placeholder="全部"
                  value={filters.status}
                  onChange={(value) => setFilters({ ...filters, status: value })}
                  allowClear
                  style={{ width: '100%' }}
                >
                  <Option value="">全部</Option>
                  <Option value="SUCCESS">成功</Option>
                  <Option value="FAIL">失败</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={8}>
              <Form.Item label="时间范围" style={{ marginBottom: 0, width: '100%' }}>
                <RangePicker
                  value={
                    filters.startTime && filters.endTime
                      ? [dayjs(filters.startTime), dayjs(filters.endTime)]
                      : null
                  }
                  onChange={(dates) => {
                    if (dates && dates[0] && dates[1]) {
                      setFilters({
                        ...filters,
                        startTime: dates[0].startOf('day').toISOString(),
                        endTime: dates[1].endOf('day').toISOString(),
                      });
                    } else {
                      setFilters({
                        ...filters,
                        startTime: undefined,
                        endTime: undefined,
                      });
                    }
                  }}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={24} style={{ textAlign: 'right' }}>
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
        </Form>
      </Card>

      <Card>
        <Table<AuthLog>
          rowKey="id"
          columns={columns}
          dataSource={paginatedLogs}
          scroll={{ x: 1200 }}
          onRow={(record) => ({
            onClick: () => handleViewDetail(record),
            style: { cursor: 'pointer' },
          })}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredLogs.length,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
          }}
        />
      </Card>

      <Drawer
        title="认证日志详情"
        placement="right"
        width={520}
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
      >
        {selectedLog && (
          <>
            <Descriptions title="基本信息" column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="日志ID">{selectedLog.id}</Descriptions.Item>
              <Descriptions.Item label="用户ID">{selectedLog.userId}</Descriptions.Item>
              <Descriptions.Item label="用户名">{selectedLog.username}</Descriptions.Item>
              <Descriptions.Item label="认证类型">
                <Tag color={typeTagMap[selectedLog.type].color}>
                  {typeTagMap[selectedLog.type].text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="认证状态">
                <Tag color={statusTagMap[selectedLog.status].color}>
                  {statusTagMap[selectedLog.status].text}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {selectedLog.status === 'FAIL' && selectedLog.failReason && (
              <Descriptions title="失败信息" column={1} bordered size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="失败原因">
                  <Tag color="red">{selectedLog.failReason}</Tag>
                </Descriptions.Item>
              </Descriptions>
            )}

            <Descriptions title="时间信息" column={1} bordered size="small">
              <Descriptions.Item label="认证时间">
                {formatDateTime(selectedLog.createdAt)}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Drawer>
    </PageContainer>
  );
}
