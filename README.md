# ClassInsight - 课堂状态分析平台

一个面向课堂教学场景的状态分析与教学反馈平台，通过摄像头或课堂视频采集学生课堂状态，以数据驱动的方式帮助教师优化课堂教学。

## 功能特性

- 🔐 用户登录系统
- 📊 数据看板 - 展示课堂参与度趋势和状态时长统计
- 📚 课堂管理 - 创建和管理课堂记录
- 🎬 视频上传 - 支持拖拽和文件选择上传课堂视频
- 📈 分析报告 - 详细的课堂状态分析和教学改进建议

## 技术栈

- **前端**: React 18 + TypeScript
- **路由**: React Router v6
- **状态管理**: Zustand
- **UI 框架**: Tailwind CSS
- **图表库**: Chart.js + react-chartjs-2
- **图标**: lucide-react
- **构建工具**: Vite

## 项目结构

```
d:\小学期\
├── src/
│   ├── components/
│   │   └── Layout.tsx          # 布局组件（侧边栏导航）
│   ├── pages/
│   │   ├── Login.tsx           # 登录页面
│   │   ├── Dashboard.tsx       # 数据看板
│   │   ├── Classrooms.tsx      # 课堂管理
│   │   ├── Upload.tsx          # 视频上传
│   │   └── Analysis.tsx        # 详情分析
│   ├── store/
│   │   └── index.ts            # Zustand 状态管理
│   ├── types/
│   │   └── index.ts            # TypeScript 类型定义
│   ├── utils/
│   │   └── mockData.ts         # 模拟数据
│   ├── App.tsx                 # 路由配置
│   ├── main.tsx                # 应用入口
│   └── index.css               # 全局样式
├── .trae/documents/
│   ├── prd.md                  # 产品需求文档
│   └── arch.md                 # 技术架构文档
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

开发服务器将在 http://localhost:3000 启动

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 使用说明

1. 启动项目后，使用任意邮箱和密码登录系统
2. 在"课堂管理"页面创建新课堂
3. 在"视频上传"页面上传课堂视频
4. 在"数据看板"查看分析结果和趋势
5. 点击课堂记录查看详细分析报告

## 注意事项

当前版本使用模拟数据，实际项目中需要：
- 连接后端 API
- 集成真实的视频分析服务
- 配置数据库存储
- 添加用户认证和权限管理

## 贡献

欢迎提交 Issue 和 Pull Request！

## License

MIT
