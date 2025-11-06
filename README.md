# 黄金价格API项目

基于Cloudflare Workers全栈架构的实时黄金价格监控应用，提供数据可视化、分析和导出功能。

## 功能特性

### 前端功能
- **实时价格展示**：自动获取最新黄金价格，显示获取时间和今日总体价格信息
- **详细数据表格**：展示所有黄金类型的价格信息，支持排序和涨跌颜色标识
- **数据可视化**：
  - 饼图：Top 5黄金价格分布
  - 柱状图：涨跌幅对比 (Top 10)
  - 多系列柱状图：价格区间对比 (Top 8)
- **数据导出**：支持CSV和Excel格式导出，可选择自定义字段
- **响应式设计**：适配桌面和移动设备

### 后端功能
- **API代理**：通过Cloudflare Workers代理外部黄金价格API
- **数据缓存**：5分钟缓存机制减少API调用频率
- **错误处理**：完善的错误处理和重试机制
- **数据格式化**：统一数据格式，价格字段转换为数字类型

## 技术栈

- **前端**：React 19 + TypeScript + Vite
- **图表库**：Chart.js + react-chartjs-2
- **导出功能**：PapaParse
- **后端**：Cloudflare Workers
- **样式**：CSS3 + 响应式设计

## API集成

- **数据源**：https://api.pearktrue.cn/api/goldprice/
- **数据更新**：实时获取，5分钟缓存
- **数据字段**：黄金名称、最高价、最低价、涨跌幅、买入价、卖出价等

## 开发命令

```bash
# 安装依赖
bun install

# 启动开发服务器
bun run dev

# 构建项目
bun run build

# 代码检查
bun run lint

# 预览构建结果
bun run preview

# 部署到Cloudflare Workers
bun run deploy
```

## 项目结构

```
├── src/                 # 前端源码
│   ├── App.tsx         # 主应用组件
│   ├── App.css         # 样式文件
│   └── assets/         # 静态资源
├── worker/             # Cloudflare Workers
│   └── index.ts        # API代理逻辑
├── public/             # 公共资源
└── dist/               # 构建输出
```

## 主要特性

1. **数据类型安全**：完整的TypeScript类型定义
2. **性能优化**：缓存机制、懒加载、响应式设计
3. **错误恢复**：自动重试、缓存数据回退
4. **用户体验**：加载状态、错误提示、数据刷新
5. **数据导出**：支持CSV/Excel格式，自定义字段选择

## 部署说明

项目支持一键部署到Cloudflare Workers：

```bash
npm run deploy
```

部署后可通过Cloudflare Workers域名访问应用。
