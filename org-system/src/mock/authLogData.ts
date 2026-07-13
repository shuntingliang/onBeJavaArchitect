import type { AuthLog } from '@/types';
import { hoursAgo, minutesAgo, daysAgo } from '@/utils/dateUtils';

const failReasons = [
  '密码错误',
  '用户名不存在',
  '验证码错误',
  '账号已锁定',
  '账号已禁用',
  'IP地址受限',
];

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36',
];

const ips = [
  '192.168.1.101',
  '192.168.1.102',
  '10.0.0.50',
  '172.16.0.25',
  '123.45.67.89',
  '114.114.114.114',
  '8.8.8.8',
];

const userList = [
  { userId: 'user-001', username: 'zhangsan' },
  { userId: 'user-002', username: 'lisi' },
  { userId: 'user-003', username: 'wangwu' },
  { userId: 'user-004', username: 'zhaoliu' },
  { userId: 'user-005', username: 'sunqi' },
  { userId: 'user-006', username: 'zhouba' },
  { userId: 'user-007', username: 'wujiu' },
  { userId: 'user-008', username: 'zhengshi' },
  { userId: 'user-009', username: 'qianyi' },
  { userId: 'user-011', username: 'chensan' },
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const authLogs: AuthLog[] = (() => {
  const logs: AuthLog[] = [];
  let id = 1;

  for (let day = 0; day < 7; day++) {
    const logsPerDay = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < logsPerDay; i++) {
      const user = randomItem(userList);
      const isSuccess = Math.random() > 0.25;
      const isLogin = Math.random() > 0.3;
      const minutesOffset = Math.floor(Math.random() * 1440);

      logs.push({
        id: `log-${String(id).padStart(4, '0')}`,
        userId: user.userId,
        username: user.username,
        type: isLogin ? 'LOGIN' : 'LOGOUT',
        status: isSuccess ? 'SUCCESS' : 'FAIL',
        ip: randomItem(ips),
        userAgent: randomItem(userAgents),
        failReason: isSuccess ? undefined : randomItem(failReasons),
        createdAt: minutesAgo(day * 1440 + minutesOffset),
      });
      id++;
    }
  }

  for (let hour = 0; hour < 24; hour++) {
    if (Math.random() > 0.4) {
      const user = randomItem(userList);
      const isSuccess = Math.random() > 0.15;
      const isLogin = Math.random() > 0.35;

      logs.push({
        id: `log-${String(id).padStart(4, '0')}`,
        userId: user.userId,
        username: user.username,
        type: isLogin ? 'LOGIN' : 'LOGOUT',
        status: isSuccess ? 'SUCCESS' : 'FAIL',
        ip: randomItem(ips),
        userAgent: randomItem(userAgents),
        failReason: isSuccess ? undefined : randomItem(failReasons),
        createdAt: hoursAgo(hour + Math.random()),
      });
      id++;
    }
  }

  for (let i = 0; i < 8; i++) {
    const user = randomItem(userList);
    const isSuccess = Math.random() > 0.1;
    const isLogin = Math.random() > 0.4;

    logs.push({
      id: `log-${String(id).padStart(4, '0')}`,
      userId: user.userId,
      username: user.username,
      type: isLogin ? 'LOGIN' : 'LOGOUT',
      status: isSuccess ? 'SUCCESS' : 'FAIL',
      ip: randomItem(ips),
      userAgent: randomItem(userAgents),
      failReason: isSuccess ? undefined : randomItem(failReasons),
      createdAt: minutesAgo(Math.floor(Math.random() * 60)),
    });
    id++;
  }

  return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
})();

export default authLogs;
