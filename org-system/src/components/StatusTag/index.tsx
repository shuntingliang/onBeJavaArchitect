import { Tag } from 'antd';
import type { TagProps } from 'antd';

export type StatusType = 'org' | 'user' | 'position' | 'template';
export type StatusValue = 'active' | 'inactive' | 'draft' | 'published' | 'disabled';

interface StatusTagProps {
  type?: StatusType;
  status: StatusValue;
  text?: string;
}

const statusColorMap: Record<StatusValue, TagProps['color']> = {
  active: 'green',
  inactive: 'default',
  draft: 'orange',
  published: 'blue',
  disabled: 'red',
};

const statusTextMap: Record<StatusValue, string> = {
  active: '启用',
  inactive: '停用',
  draft: '草稿',
  published: '已发布',
  disabled: '禁用',
};

export default function StatusTag({ status, text }: StatusTagProps) {
  return <Tag color={statusColorMap[status]}>{text || statusTextMap[status]}</Tag>;
}
