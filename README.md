# IDE工作空间插件

这是一个Buddy插件，用于显示当前IDE的工作空间信息。目前支持VSCode和Cursor。

## 功能特点

- 支持检测当前IDE是否为VSCode或Cursor
- 支持读取VSCode和Cursor的工作空间信息
- 支持打开工作区文件浏览器
- 支持Git自动提交功能，可一键提交并推送未保存更改
- 跨平台支持（Windows、macOS、Linux）
- TypeScript编写，提供完整的类型定义

## 项目结构

```
.
├── src/
│   ├── index.ts          # 插件入口文件
│   ├── types/            # 类型定义
│   │   └── index.ts
│   ├── services/         # 服务实现
│   │   ├── vscode.ts     # VSCode服务
│   │   └── cursor.ts     # Cursor服务
│   └── utils/            # 工具函数
│       ├── logger.ts     # 日志工具
│       ├── workspace-cache.ts  # 工作区缓存
│       └── git-helper.ts # Git工具
├── dist/                 # 编译输出目录
├── package.json
├── tsconfig.json
└── README.md
```

## 安装

```bash
pnpm install
```

## 开发

```bash
# 编译
pnpm build

# 监听模式
pnpm watch

# 运行测试
pnpm test

# 测试Git功能
pnpm ts-node src/test-git.ts
```

## 使用方法

1. 将插件安装到GitOK的插件目录
2. 当激活的应用是VSCode或Cursor时，插件会自动显示可用动作
3. 可用动作包括:
   - 显示工作空间: 显示当前IDE的工作空间路径
   - 在文件浏览器中打开: 打开工作区对应的文件浏览器
   - Git提交并推送: 当工作区有未提交的更改时，自动提交并推送到远程仓库

## Git自动提交功能

当工作区为Git仓库且有未提交的更改时，插件会自动显示"Git提交并推送"动作。点击此动作将：

1. 自动将所有更改添加到暂存区
2. 使用带时间戳的提交信息创建一个新的提交
3. 推送到远程仓库的当前分支

这个功能非常适合快速保存工作进度，无需手动执行Git命令。

## 许可证

MIT 