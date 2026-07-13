import { Card, Row, Col, Statistic, List, Tag, Progress, Space } from 'antd';
import {
  ApartmentOutlined,
  TeamOutlined,
  UserOutlined,
  LoginOutlined,
  PlusOutlined,
  UploadOutlined,
  SettingOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/PageContainer';
import { useAppStore } from '@/store';
import { authLogs } from '@/mock/authLogData';
import { formatDateTime, relativeTime } from '@/utils/dateUtils';
import type { AuthLog } from '@/types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { orgCount, positionCount, userCount, todayLoginCount } = useAppStore();

  const quickActions = [
    { title: '新建组织', icon: <PlusOutlined />, path: '/organization', color: '#1890ff' },
    { title: '导入用户', icon: <UploadOutlined />, path: '/user', color: '#52c41a' },
    { title: '模板管理', icon: <FileTextOutlined />, path: '/template/organization', color: '#722ed1' },
    { title: '系统设置', icon: <SettingOutlined />, path: '/security/policy', color: '#fa8c16' },
  ];

  return (
    <PageContainer title="仪表盘" subTitle="欢迎回来，查看系统概览">
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="组织节点数"
              value={orgCount}
              prefix={<ApartmentOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="岗位数"
              value={positionCount}
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="用户数"
              value={userCount}
              prefix={<UserOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日登录次数"
              value={todayLoginCount}
              prefix={<LoginOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="组织架构概览" style={{ height: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>总组织数</span>
                  <span style={{ fontWeight: 500 }}>{orgCount} 个</span>
                </div>
                <Progress percent={85} strokeColor="#1890ff" showInfo={false} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>活跃组织</span>
                  <span style={{ fontWeight: 500 }}>24 个</span>
                </div>
                <Progress percent={86} strokeColor="#52c41a" showInfo={false} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>停用组织</span>
                  <span style={{ fontWeight: 500 }}>4 个</span>
                </div>
                <Progress percent={14} strokeColor="#ff4d4f" showInfo={false} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>组织层级深度</span>
                  <span style={{ fontWeight: 500 }}>5 层</span>
                </div>
                <Progress percent={60} strokeColor="#722ed1" showInfo={false} />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="最近登录记录" style={{ height: '100%' }}>
            <List<AuthLog>
              dataSource={authLogs.slice(0, 5)}
              renderItem={(item) => (
                <List.Item key={item.id}>
                  <List.Item.Meta
                    avatar={<UserOutlined />}
                    title={
                      <Space>
                        <span>{item.username}</span>
                        <Tag color={item.status === 'SUCCESS' ? 'green' : 'red'}>
                          {item.status === 'SUCCESS' ? '成功' : '失败'}
                        </Tag>
                        <Tag color="blue">{item.type}</Tag>
                      </Space>
                    }
                    description={
                      <Space size="large">
                        <span style={{ color: '#999' }}>{relativeTime(item.createdAt)}</span>
                        <Tag color="geekblue">{item.ip}</Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card title="快捷操作" style={{ marginTop: 16 }}>
        <Row gutter={[16, 16]}>
          {quickActions.map((action) => (
            <Col xs={12} sm={6} key={action.title}>
              <Card
                hoverable
                style={{ textAlign: 'center', cursor: 'pointer' }}
                onClick={() => navigate(action.path)}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    margin: '0 auto 12px',
                    borderRadius: 12,
                    background: `${action.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    color: action.color,
                  }}
                >
                  {action.icon}
                </div>
                <div style={{ fontWeight: 500 }}>{action.title}</div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </PageContainer>
  );
}
