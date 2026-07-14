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
  message,
  Tooltip,
  Typography,
  Row,
  Col,
  Switch,
} from 'antd';
import type { ColumnsType } from 'antd/es/table/interface';
import {
  SearchOutlined,
  ReloadOutlined,
  SyncOutlined,
  StopOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import PageContainer from '@/components/PageContainer';
import { useTokenStore } from '@/store/tokenStore';
import { formatDateTime } from '@/utils/dateUtils';
import type { UserToken, TokenStatus } from '@/types';

const { Option } = Select;
const { Text } = Typography;

const statusTagMap: Record<TokenStatus, { color: string; text: string }> = {
  ACTIVE: { color: 'green', text: '有效' },
  EXPIRED: { color: 'orange', text: '已过期' },
  REVOKED: { color: 'red', text: '已吊销' },
};

const statusOptions = [
  { label: '全部', value: '' },
  { label: '有效', value: 'ACTIVE' },
  { label: '已过期', value: 'EXPIRED' },
  { label: '已吊销', value: 'REVOKED' },
];

export default function TokenPage() {
  const tokens = useTokenStore((state) => state.tokens);
  const refreshToken = useTokenStore((state) => state.refreshToken);
  const revokeToken = useTokenStore((state) => state.revokeToken);

  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailToken, setDetailToken] = useState<UserToken | null>(null);

  const filteredTokens = useMemo(() => {
    let result = [...tokens];

    if (keyword) {
      const kw = keyword.toLowerCase();
      result = result.filter(
        (t) =>
          t.username.toLowerCase().includes(kw) ||
          t.userId.toLowerCase().includes(kw) ||
          t.token.toLowerCase().includes(kw)
      );
    }

    if (statusFilter) {
      result = result.filter((t) => t.status === statusFilter);
    }

    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [tokens, keyword, statusFilter]);

  const paginatedTokens = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTokens.slice(start, start + pageSize);
  }, [filteredTokens, currentPage, pageSize]);

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleReset = () => {
    setKeyword('');
    setStatusFilter('');
    setShowDeleted(false);
    setCurrentPage(1);
  };

  const handleRefresh = (record: UserToken) => {
    if (record.status === 'REVOKED') {
      message.warning('已吊销的令牌无法刷新');
      return;
    }
    Modal.confirm({
      title: '确认刷新令牌',
      content: `确定要刷新用户 "${record.username}" 的令牌吗？刷新后将生成新的令牌并延长有效期。`,
      okText: '确认刷新',
      cancelText: '取消',
      onOk: () => {
        refreshToken(record.id);
        message.success('令牌刷新成功');
      },
    });
  };

  const handleRevoke = (record: UserToken) => {
    if (record.status === 'REVOKED') {
      message.warning('该令牌已被吊销');
      return;
    }
    Modal.confirm({
      title: '确认吊销令牌',
      content: `确定要吊销用户 "${record.username}" 的令牌吗？吊销后该令牌将立即失效。`,
      okText: '确认吊销',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        revokeToken(record.id);
        message.success('令牌已吊销');
      },
    });
  };

  const handleViewDetail = (record: UserToken) => {
    setDetailToken(record);
    setDetailModalOpen(true);
  };

  const maskToken = (token: string) => {
    if (token.length <= 20) return token;
    return `${token.slice(0, 20)}...${token.slice(-8)}`;
  };

  const columns: ColumnsType<UserToken> = [
    {
      title: '用户ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 120,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '令牌状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TokenStatus) => (
        <Tag color={statusTagMap[status].color}>{statusTagMap[status].text}</Tag>
      ),
    },
    {
      title: '过期时间',
      dataIndex: 'expiredAt',
      key: 'expiredAt',
      width: 170,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '最后使用时间',
      dataIndex: 'lastUsedAt',
      key: 'lastUsedAt',
      width: 170,
      render: (date: string) => formatDateTime(date),
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
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<SyncOutlined />}
            onClick={() => handleRefresh(record)}
            disabled={record.status === 'REVOKED'}
          >
            刷新
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<StopOutlined />}
            onClick={() => handleRevoke(record)}
            disabled={record.status === 'REVOKED'}
          >
            吊销
          </Button>
        </Space>
      ),
    },
  ];

  const tokenStatusStats = useMemo(() => {
    const total = tokens.length;
    const active = tokens.filter((t) => t.status === 'ACTIVE').length;
    const expired = tokens.filter((t) => t.status === 'EXPIRED').length;
    const revoked = tokens.filter((t) => t.status === 'REVOKED').length;
    return { total, active, expired, revoked };
  }, [tokens]);

  return (
    <PageContainer title="令牌管理" subTitle="管理系统用户访问令牌，支持刷新和吊销操作">
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} sm={12} md={8} lg={6}>
            <div style={{ marginBottom: 8, color: '#666' }}>用户名/用户ID</div>
            <Input
              placeholder="请输入用户名或用户ID"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <div style={{ marginBottom: 8, color: '#666' }}>令牌状态</div>
            <Select
              placeholder="请选择状态"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              allowClear
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
          <Tag color="blue">刷新令牌：生成新令牌并延长30天有效期</Tag>
          <Tag color="red">吊销令牌：立即失效，无法恢复</Tag>
          <Tag color="orange">已过期令牌：到期自动失效，可刷新续期</Tag>
        </Space>
      </div>

      <Card>
        <Table<UserToken>
          rowKey="id"
          columns={columns}
          dataSource={paginatedTokens}
          scroll={{ x: 900 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredTokens.length,
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

      {/* 详情弹框 */}
      <Modal
        title="令牌详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            关闭
          </Button>,
        ]}
        width={600}
        destroyOnClose
      >
        {detailToken && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <Text type="secondary">用户ID：</Text>
              <Text strong>{detailToken.userId}</Text>
            </div>
            <div>
              <Text type="secondary">用户名：</Text>
              <Text strong>{detailToken.username}</Text>
            </div>
            <div>
              <Text type="secondary">令牌状态：</Text>
              <Tag color={statusTagMap[detailToken.status].color}>
                {statusTagMap[detailToken.status].text}
              </Tag>
            </div>
            <div>
              <Text type="secondary">过期时间：</Text>
              <Text>{formatDateTime(detailToken.expiredAt)}</Text>
            </div>
            <div>
              <Text type="secondary">最后使用时间：</Text>
              <Text>{formatDateTime(detailToken.lastUsedAt)}</Text>
            </div>
            <div>
              <Text type="secondary">创建时间：</Text>
              <Text>{formatDateTime(detailToken.createdAt)}</Text>
            </div>
          </Space>
        )}
      </Modal>
    </PageContainer>
  );
}
