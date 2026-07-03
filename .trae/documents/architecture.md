## 1. 架构设计

```mermaid
flowchart TB
    subgraph Frontend [前端层]
        A[React 18 应用]
        B[Zustand 状态管理]
        C[Tailwind CSS 样式]
        D[React Router 路由]
    end

    subgraph Components [组件层]
        E[设备列表页 DeviceList]
        F[设备表单 DeviceForm]
        G[删除确认 DeleteConfirm]
        H[搜索组件 SearchBar]
        I[统计卡片 StatCards]
        J[表格组件 DataTable]
    end

    subgraph Data [数据层]
        K[模拟数据 MockData]
        L[本地状态 Store]
    end

    A --> E
    A --> F
    A --> G
    A --> H
    A --> I
    E --> J
    E --> H
    E --> I
    B --> L
    L --> K
```

## 2. 技术选型

- **前端框架**: React@18 + TypeScript
- **构建工具**: Vite
- **样式方案**: Tailwind CSS v3
- **状态管理**: Zustand
- **路由**: React Router DOM
- **图标库**: lucide-react
- **UI 组件**: 自定义组件 + Tailwind 样式
- **初始化工具**: vite-init (react-ts 模板)
- **后端**: 无（纯前端项目，使用模拟数据）

## 3. 路由定义

| 路由路径 | 用途 | 组件 |
|---------|------|------|
| / | 设备管理主页 | DevicePage |
| /devices | 设备列表（别名） | DevicePage |

## 4. API 定义（模拟接口）

由于是纯前端项目，使用模拟数据和本地状态管理替代真实 API。

### 4.1 TypeScript 类型定义

```typescript
// 设备类型枚举
type DeviceType = 'sensor' | 'gateway' | 'controller' | 'camera';

// 设备状态枚举
type DeviceStatus = 'online' | 'offline' | 'maintenance';

// 设备接口
interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  ipAddress: string;
  location?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// 表单数据接口（不含时间戳）
interface DeviceFormData {
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  ipAddress: string;
  location?: string;
  description?: string;
}
```

### 4.2 状态管理 Store 接口

```typescript
interface DeviceStore {
  devices: Device[];
  searchQuery: string;
  currentPage: number;
  pageSize: number;

  // 操作方法
  addDevice: (data: DeviceFormData) => void;
  updateDevice: (id: string, data: DeviceFormData) => void;
  deleteDevice: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setCurrentPage: (page: number) => void;
}
```

## 5. 项目结构

```
src/
├── components/
│   ├── DeviceTable.tsx      # 设备数据表格
│   ├── DeviceForm.tsx       # 新增/编辑设备表单
│   ├── DeleteConfirm.tsx    # 删除确认对话框
│   ├── SearchBar.tsx        # 搜索栏组件
│   ├── StatCards.tsx        # 统计卡片组件
│   └── Pagination.tsx       # 分页组件
├── hooks/
│   └── useDevices.ts        # 设备相关逻辑 hook
├── pages/
│   └── DevicePage.tsx       # 设备管理主页面
├── store/
│   └── deviceStore.ts       # Zustand 状态存储
├── types/
│   └── device.ts            # TypeScript 类型定义
├── data/
│   └── mockData.ts          # 模拟初始数据
├── utils/
│   └── helpers.ts           # 工具函数
├── App.tsx                  # 应用入口
├── main.tsx                 # React 渲染入口
└── index.css                # 全局样式
```

## 6. 组件交互流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant Page as DevicePage
    participant Store as DeviceStore
    participant Table as DeviceTable
    participant Form as DeviceForm
    participant Dialog as DeleteConfirm

    User->>Page: 访问页面
    Page->>Store: 获取设备列表
    Store-->>Page: 返回设备数据
    Page->>Table: 渲染表格

    User->>Page: 点击新增按钮
    Page->>Form: 打开新增表单（空数据）
    User->>Form: 填写并提交
    Form->>Store: addDevice()
    Store-->>Page: 刷新列表

    User->>Table: 点击编辑图标
    Table->>Form: 打开编辑表单（预填数据）
    User->>Form: 修改并提交
    Form->>Store: updateDevice()
    Store-->>Page: 更新列表项

    User->>Table: 点击删除图标
    Table->>Dialog: 显示确认框
    User->>Dialog: 确认删除
    Dialog->>Store: deleteDevice()
    Store-->>Page: 移除该项
```

## 7. 初始模拟数据

系统预置 12-15 条设备示例数据，覆盖不同设备类型和状态，用于演示完整功能。
