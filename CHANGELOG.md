# Changelog

所有重要的版本变更都将记录在此文件中。本项目遵循[语义化版本](https://semver.org/lang/zh-CN/)规范。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

## [0.3.0] - 2026-05-10

### Added

- **CC Sync Log 终端风格组件**
  - 实现 `CCSyncLog` 组件，支持终端风格的消息显示
  - 集成打字机效果和命令提示符样式
  - 支持用户消息、Claude 响应、系统通知三种消息类型
  - 自动滚动和消息时间戳显示

- **状态卡片组件**
  - `SystemStatusCard` - 系统状态展示
  - `WorkloadCard` - 工作负载监控
  - 实时反映影子分身工作状态

- **SSE 实时推送**
  - 实现 Server-Send Events 实时通信
  - 自动降级到轮询机制
  - 支持任务更新、消息推送、状态变更等事件

- **CC 通信协议**
  - 定义完整的消息协议格式
  - 支持 Webhook 端点接收 CC 消息
  - 消息队列和自动回复机制

- **任务生命周期状态机**
  - 完善的任务状态流转：pending → in_progress → completed → needs_feedback → closed
  - 状态变更自动记录日志
  - 领取任务和完成任务专用 API

### Added (UI/UX)

- **ErrorBoundary**
  - 全局错误边界组件
  - 优雅降级和错误提示

- **结构化日志**
  - 基于 pino 的结构化日志系统
  - 支持多级别日志输出
  - 包含时间戳和上下文信息

- **骨架屏加载**
  - 任务卡片和数据加载骨架屏
  - 提升感知加载速度

- **404 页面**
  - 自定义 Not Found 页面
  - 友好提示和导航引导

- **页面过渡动画**
  - Framer Motion 驱动的页面切换动画
  - 路由过渡效果

- **任务卡片微交互**
  - 悬停缩放效果
  - 拖拽视觉反馈
  - 点击涟漪效果

- **侧边栏折叠展开**
  - 可折叠侧边栏
  - 保存折叠状态到 localStorage

- **Toast 组件**
  - 通知提示组件
  - 支持多种类型：success / error / warning / info
  - 自动消失和手动关闭

## [0.2.0] - 2026-05-10

### Added

- **功能修复与增强**
  - 删除任务确认对话框
  - 面包屑导航组件
  - 附件上传功能
  - Settings 页面数据持久化

- **Toast 通知**
  - 操作成功/失败通知
  - 全局 ToastContext

- **移动端底部导航**
  - 响应式移动端布局
  - 底部 Tab 导航栏
  - 触摸友好的交互

- **优先级系统升级**
  - CSS 变量化优先级样式
  - 新增 Urgent 紧急级别
  - 优先级颜色标识

## [0.1.0] - 2026-05-10

### Added

- **完整 UI 重构**
  - 8 套精选主题系统（sahara、shadow-clone、geist-dark、neon-tokyo、candy、glacier、lumina-tech、alexandria）
  - 侧边栏布局框架
  - 6 个核心页面（看板、任务列表、任务详情、新建任务、归档、设置）

- **协作看板核心功能**
  - 看板列视图（pending、in_progress、completed、closed）
  - 任务卡片展示
  - 拖拽排序
  - 实时统计

- **API 路由**
  - 任务 CRUD 接口
  - 消息系统接口
  - 影子状态接口
  - Webhook 接收端

- **数据库初始化**
  - SQLite 数据库设计
  - 自动化初始化脚本
  - 数据表结构和索引

---

## 版本路线图

### 0.4.0 (规划中)

- [ ] GitLab MR 自动关联
- [ ] 任务搜索和筛选增强
- [ ] 导出功能（CSV/JSON）
- [ ] 多语言支持

### 0.5.0 (规划中)

- [ ] WebSocket 实时通信
- [ ] 任务评论功能
- [ ] @提及通知
- [ ] 任务分配给多人

### 1.0.0 (目标)

- [ ] 完整的 CC 插件集成
- [ ] 生产环境部署文档
- [ ] Docker 支持
- [ ] CI/CD 自动化测试
