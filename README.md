<div align="center">
  <h1>
    🤖 ShadowMe
  </h1>
  <p>
    <strong>智能影子分身协作看板 - 让 AI 成为你的协作伙伴</strong>
  </p>
  <p>
    <a href="https://github.com/xiaopengs/ShadowMe/stargazers">
      <img src="https://img.shields.io/github/stars/xiaopengs/ShadowMe?style=flat-square" alt="Stars" />
    </a>
    <a href="https://github.com/xiaopengs/ShadowMe/issues">
      <img src="https://img.shields.io/github/issues/xiaopengs/ShadowMe?style=flat-square" alt="Issues" />
    </a>
    <a href="https://github.com/xiaopengs/ShadowMe/blob/main/LICENSE">
      <img src="https://img.shields.io/github/license/xiaopengs/ShadowMe?style=flat-square" alt="License" />
    </a>
  </p>

  <p>
    <a href="#✨-核心特性">核心特性</a> ·
    <a href="#🚀-快速开始-5分钟上手">快速开始</a> ·
    <a href="#📖-完整使用教程">完整教程</a> ·
    <a href="#❓-常见问题">常见问题</a>
  </p>
</div>

---

## 💡 什么是 ShadowMe？

想象一下：你是一个忙碌的开发者，团队成员需要你帮忙处理任务，但你分身乏术？

**ShadowMe 就是你的解决方案！** 🎉

ShadowMe 是一个智能协作看板，它让你：
- 📋 创建任务 - 同事在看板上创建任务
- 🤖 影子分身 - Claude Code 自动接收任务
- ⚡ 自动执行 - AI 在本地帮你处理
- ✅ 结果回传 - 完成后自动更新看板

**就像有了一个不知疲倦的小助手！**

---

## ✨ 核心特性

| 特性 | 描述 |
|------|------|
| 🎨 **精美界面** | Sahara 沙漠暖色调，看久了不累眼 |
| 📋 **协作看板** | 直观的任务管理，一目了然 |
| 💬 **实时消息** | 与影子分身实时对话 |
| 🔔 **自动推送** | 任务状态更新立刻知道 |
| 🔗 **GitLab 集成** | 自动创建 MR，提交代码 |
| 📱 **响应式设计** | 手机、电脑都能用 |
| 🤝 **Claude Code 集成** | 直接在 VS Code 中使用 |

---

## 🚀 快速开始 - 5分钟上手

### 视频教程（假装有视频 😄）
> 文字教程更详细，看下面！

---

## 📖 完整使用教程

### 第一步：准备工作

在开始之前，你需要：

✅ **电脑一台**（Windows / Mac / Linux 都可以）
✅ **Node.js 20+**（如果没安装，去 [官网](https://nodejs.org) 下载）
✅ **VS Code**（推荐，也可以用别的编辑器）
✅ **Claude Pro / Max 账号**（或者有 API Key 也行）

---

### 第二步：安装 ShadowMe 看板

#### 2.1 下载代码

打开终端（Mac/Linux 叫终端，Windows 叫命令提示符或 PowerShell），输入：

```bash
# 下载项目
git clone https://github.com/xiaopengs/ShadowMe.git

# 进入项目目录
cd ShadowMe
```

**新手提示**：不知道怎么打开终端？
- Mac：按 `Cmd + 空格`，输入 Terminal
- Windows：按 `Win + R`，输入 cmd
- VS Code：在菜单里选 终端 → 新建终端

#### 2.2 安装依赖

```bash
npm install
```

**这步会等一会儿，别着急，在下载需要的文件呢！** ☕

#### 2.3 配置环境变量

```bash
# 复制一份配置文件
cp .env.example .env.local
```

**新手提示**：Windows 用户如果上面的命令不行，手动复制一下吧！
- 找到 `.env.example` 文件
- 复制一份，改名叫 `.env.local`

打开 `.env.local` 文件，只需要改这一行（如果看板不在本机的话）：

```env
# 看板地址，默认本机就行
SHADOW_BOARD_URL=http://localhost:3000
```

#### 2.4 初始化数据库

```bash
npm run db:init
```

**看到 "Database initialized successfully" 就对了！** 🎉

#### 2.5 启动看板！

```bash
# 开发模式（推荐，改代码自动刷新）
npm run dev
```

或者生产模式：

```bash
npm run build
npm start
```

**看到下面这行就成功了！**
```
✓ Ready in ...
```

现在打开浏览器访问：**http://localhost:3000**

---

### 第三步：认识一下界面！

打开浏览器，你会看到：

| 区域 | 功能 |
|------|------|
| 🤖 **左上角头像** | 影子分身的状态显示 |
| 📊 **看板区域** | 任务卡片，拖拽调整状态 |
| 💬 **底部日志** | 与影子分身的对话记录 |
| 📱 **侧边栏** | 导航菜单（移动端在底部） |

---

### 第四步：安装 Claude Code VS Code 扩展

#### 4.1 安装扩展

1. 打开 VS Code
2. 点击左侧扩展图标（或者按 `Ctrl+Shift+X` / `Cmd+Shift+X`）
3. 搜索 **"Claude Code"**
4. 安装官方的 Anthropic 出品的那个（有 2M+ 下载量的）

#### 4.2 登录账号

1. 点击 VS Code 活动栏的 **Spark 图标** ✨
2. 按提示登录你的 Claude 账号
3. 授权完成就可以用了！

---

### 第五步：安装 ShadowMe 插件

#### 5.1 打开 Claude Code

在 VS Code 中：
1. 点击活动栏的 Spark 图标 ✨
2. 或者按 `Ctrl+Shift+P` 输入 **"Claude Code: Open in New Tab"**

#### 5.2 打开插件管理

在 Claude Code 对话框中输入：

```
/plugins
```

#### 5.3 添加 ShadowMe 插件

1. 在 Claude Code 对话框中输入 `/plugins` 并发送

2. 会打开 **Manage plugins** 界面，点击 **Marketplaces** 标签

3. 添加本地插件目录：

   **Mac / Linux 用户：**
   ```
   /workspace/ShadowMe/plugins/ShadowMe-plugin
   ```

   **Windows 用户：**
   ```
   D:\AICoding\trea\ShadowMe\plugins\ShadowMe-plugin
   ```
   
   **新手提示**：路径要改成你实际放代码的地方！比如你的代码在 D 盘，就改成 `D:\你的文件夹\ShadowMe\plugins\ShadowMe-plugin`

4. 添加完路径后，刷新一下（点击刷新图标），然后回到 **Plugins** 标签，就会看到 shadowme 插件

5. 或者直接用命令启动（推荐新手）：

   **Mac / Linux：**
   ```bash
   claude --plugin-dir /workspace/ShadowMe/plugins/ShadowMe-plugin
   ```

   **Windows（PowerShell）：**
   ```powershell
   claude --plugin-dir D:\AICoding\trea\ShadowMe\plugins\ShadowMe-plugin
   ```

   **Windows（CMD）：**
   ```cmd
   claude --plugin-dir "D:\AICoding\trea\ShadowMe\plugins\ShadowMe-plugin"
   ```

#### 5.4 安装插件

- 在 **Plugins** 标签的 "Available plugins" 下面找到 **shadowme**
- 点击 **Install**
- 选择安装范围：
  - **Install for you**：所有项目都能用（用户范围）
  - **Install for this project**：只用于当前项目（推荐）
  - **Install locally**：只在这个仓库用

---

### 第六步：配置插件（可选但推荐）

进入插件目录配置一下：

```bash
cd plugins/ShadowMe-plugin
cp .env.example .env
```

编辑 `.env` 文件：

**Mac / Linux 用户示例：**
```env
# 看板地址（跟之前一样）
SHADOW_BOARD_URL=http://localhost:3000

# GitLab 配置（如果有的话）
GITLAB_URL=https://gitlab.example.com
GITLAB_TOKEN=glpat_你的token
GITLAB_DEFAULT_PROJECT=123
WORKING_DIRECTORY=/home/你的用户名/projects
```

**Windows 用户示例：**
```env
# 看板地址（跟之前一样）
SHADOW_BOARD_URL=http://localhost:3000

# GitLab 配置（如果有的话）
GITLAB_URL=https://gitlab.example.com
GITLAB_TOKEN=glpat_你的token
GITLAB_DEFAULT_PROJECT=123
WORKING_DIRECTORY=D:\AICoding\trea
```

**新手提示**：`WORKING_DIRECTORY` 就是你平时写代码放项目的文件夹！比如你所有项目都在 `D:\AICoding\trea` 下面，就填这个路径。

---

### 第七步：开始使用！🎉

#### 场景 1：创建任务（模拟同事）

1. 打开浏览器访问 **http://localhost:3000**
2. 点击 **"新建任务"** 按钮
3. 填写任务信息：
   - 标题：帮我写个登录页面
   - 类型：technical_issue
   - 优先级：high
   - 描述：简单的登录界面就行
4. 点击 **"创建"**

#### 场景 2：影子分身接收任务（你是开发者）

1. 在 VS Code 打开 Claude Code
2. 输入：
   ```
   /shadowme:list-tasks
   ```
3. 看到刚创建的任务了！

#### 场景 3：领取任务

```
/shadowme:take-task
```

选择刚才的任务 ID，Claude 会帮你领取！

#### 场景 4：完成任务

```
/shadowme:complete-task
```

填写任务结果，比如：
- 结果类型：merge_request
- 摘要：已完成登录页面
- URL：MR 的链接（如果有的话）

---

## 🎯 日常使用流程

### 完整工作流示例

**上午 9:00** - 同事小 A：
1. 打开 ShadowMe 看板
2. 创建任务："帮我修复用户反馈的登录问题"
3. 设置优先级：high

**上午 9:05** - 影子分身自动检测：
1. Claude Code 收到通知
2. 自动（或手动）领取任务
3. 开始在本地分析代码

**上午 9:30** - 任务完成：
1. AI 修改好代码
2. 创建 GitLab MR
3. 调用 `/shadowme:complete-task` 提交结果

**上午 9:31** - 看板更新：
1. 任务自动变成 "已完成"
2. 同事可以看到结果和 MR 链接
3. 完美！✨

---

## 🔧 技能命令大全

### 在 Claude Code 中使用

| 命令 | 功能 | 什么时候用 |
|------|------|-----------|
| `/shadowme:status` | 检查看板状态 | 想知道看板连没连上 |
| `/shadowme:list-tasks` | 列出所有任务 | 查看有什么任务 |
| `/shadowme:create-task` | 创建任务 | 有新需求了 |
| `/shadowme:take-task` | 领取任务 | 准备开始干活 |
| `/shadowme:complete-task` | 完成任务 | 干完了提交结果 |

### 任务状态说明

| 状态 | 含义 |
|------|------|
| 🟡 **pending** | 待处理，还没人领 |
| 🔵 **in_progress** | 进行中，正在处理 |
| 🟢 **completed** | 已完成，等反馈 |
| ⚪ **closed** | 已关闭，结束了 |

---

## 📁 项目结构说明

```
ShadowMe/
├── public/              # 图片、图标等静态资源
├── plugins/
│   └── ShadowMe-plugin/ # Claude Code 插件
│       ├── .claude-plugin/  # 插件配置
│       ├── skills/          # 插件技能
│       └── src/             # 插件源码
├── src/
│   ├── app/             # 主程序代码
│   │   ├── api/        # API 接口
│   │   ├── page.tsx    # 首页（看板）
│   │   └── ...
│   ├── components/     # 组件
│   ├── lib/            # 工具库
│   └── context/        # 全局状态
├── data/               # 数据库文件（自动生成）
├── scripts/            # 脚本
└── README.md          # 就是这个文件！
```

---

## ❓ 常见问题

### 1. npm install 失败？

**问题**：一堆红色错误

**解决方案**：
1. 检查 Node.js 版本（>= 20）：`node -v`
2. 试试删除 `node_modules` 重新装：
   ```bash
   rm -rf node_modules package-lock.json  # Mac/Linux
   # Windows 手动删除文件夹
   npm install
   ```
3. 换国内镜像源：
   ```bash
   npm config set registry https://registry.npmmirror.com
   ```

### 2. 访问 localhost:3000 打不开？

**问题**：浏览器显示无法访问

**解决方案**：
1. 检查终端有没有报错
2. 确认 `npm run dev` 正在运行
3. 看看端口是不是被占了，换个端口试试：
   ```bash
   PORT=8080 npm run dev
   ```

### 3. 插件找不到？

**问题**：Claude Code 里看不到 shadowme 插件

**解决方案**：
1. 确认是输入了 `/plugins` 而不是别的，这样会打开 "Manage plugins" 界面
2. 在 "Marketplaces" 标签里添加插件路径，不是在 "Plugins" 标签里
3. 确认路径输对了，不要写错目录
4. 刷新一下 marketplaces（点击刷新图标）
5. 重新加载插件：
   ```
   /reload-plugins
   ```
6. 重启 Claude Code 或 VS Code

### 4. Windows 路径怎么写？

**问题**：不知道 Windows 路径格式，或者提示找不到路径

**解决方案**：
- Windows 路径用反斜杠 `\`，比如 `D:\AICoding\trea\ShadowMe`
- 如果路径有空格，用引号括起来，比如 `"D:\My Projects\ShadowMe"`
- 在 Marketplaces 里直接粘贴完整路径就行
- 在命令行里，PowerShell 和 CMD 都支持 Windows 路径

**举个例子**：
| 系统 | 路径写法 |
|------|---------|
| Mac/Linux | `/workspace/ShadowMe/plugins/ShadowMe-plugin` |
| Windows | `D:\AICoding\trea\ShadowMe\plugins\ShadowMe-plugin` |

### 5. 连不上 GitLab？

**问题**：创建 MR 时报错

**解决方案**：
1. 检查 `.env` 里的 GitLab 配置对不对
2. Token 有没有过期，去 GitLab 重新生成一个
3. Token 要有 api、write_repository 权限

### 6. 还是不会用？

**别担心！**
1. 仔细再看一遍教程
2. 看项目里的示例代码
3. 提 Issue 问我们！

---

## 🛠️ 技术栈

好奇这是用什么写的？

| 技术 | 用途 |
|------|------|
| **Next.js 16** | React 全栈框架 |
| **TypeScript** | 类型安全，少写 bug |
| **sql.js** | 纯 JS 数据库，跨平台 |
| **Tailwind CSS** | 样式框架，好看！ |
| **Framer Motion** | 动画效果 |
| **Lucide** | 图标库 |
| **Claude Code** | AI 编程助手 |

---

## 🤝 贡献指南

想一起完善 ShadowMe？太欢迎了！

1. **Fork 本仓库** - 点击右上角 Fork 按钮
2. **创建分支** - `git checkout -b feature/你的特性`
3. **提交代码** - `git commit -m '添加牛逼功能'`
4. **推送分支** - `git push origin feature/你的特性`
5. **创建 Pull Request** - 告诉我们你改了啥！

---

## 📜 许可证

MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

简单说：你可以随便用、随便改，但要保留版权声明。

---

## 🙏 感谢

- [Next.js](https://nextjs.org/) - 伟大的框架
- [Tailwind CSS](https://tailwindcss.com/) - 样式救星
- [Framer Motion](https://www.framer.com/motion/) - 动画专家
- [Lucide](https://lucide.dev/) - 漂亮的图标
- [Claude](https://claude.ai/) - AI 太厉害了！

---

## 💬 联系与支持

有问题？有建议？

- 📝 提 [Issue](https://github.com/xiaopengs/ShadowMe/issues)
- 🌟 点 Star 支持我们
- 🔗 访问 [GitHub](https://github.com/xiaopengs/ShadowMe)

---

<div align="center">
  <p>
    Made with ❤️ by ShadowMe Team
  </p>
  <p>
    祝你使用愉快！🎉
  </p>
</div>
