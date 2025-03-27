import { Logger } from './utils/logger';
import { VSCodeService } from './services/vscode';
import { CursorService } from './services/cursor';
import { WorkspaceCache } from './utils/workspace-cache';
import { GitHelper } from './utils/git-helper';
import { FileSystemHelper } from './utils/file-system-helper';
import { Action, PluginContext, ActionResult } from './types';

const logger = new Logger('IDE工作空间');
const vscodeService = new VSCodeService();
const cursorService = new CursorService();

/**
 * IDE工作空间插件
 * 用于显示当前IDE的工作空间信息
 * 提供打开工作区文件浏览器的功能
 * 工作区路径会被缓存到本地文件
 */
const plugin = {
  name: 'IDE工作空间',
  description: '显示当前IDE的工作空间信息',
  version: '1.0.0',
  author: 'Coffic',

  /**
   * 获取插件提供的动作列表
   */
  async getActions({
    keyword = '',
    overlaidApp = '',
  }: PluginContext): Promise<Action[]> {
    logger.info(`获取动作列表，关键词: "${keyword}", 应用: "${overlaidApp}"`);

    // 检查是否为支持的IDE
    const lowerApp = overlaidApp.toLowerCase();
    const isVSCode = lowerApp.includes('code') || lowerApp.includes('vscode');
    const isCursor = lowerApp.includes('cursor');

    if (!isVSCode && !isCursor) {
      logger.debug('不是支持的IDE，返回空列表');
      return [];
    }

    // 保存当前应用ID到缓存
    await WorkspaceCache.saveCurrentApp(overlaidApp);

    // 预先获取工作空间信息
    const workspace = await (isCursor
      ? cursorService.getWorkspace()
      : vscodeService.getWorkspace());

    // 将工作区路径缓存到文件中
    if (workspace) {
      await WorkspaceCache.saveWorkspace(overlaidApp, workspace);
    }

    const workspaceInfo = workspace
      ? `当前工作空间: ${workspace}`
      : `未能获取到 ${overlaidApp} 的工作空间信息`;

    // 创建动作列表
    const actions: Action[] = [
      {
        id: 'show_workspace',
        title: '显示工作空间',
        description: workspaceInfo,
        icon: '📁',
      },
    ];

    // 仅当工作区存在时添加打开文件浏览器的动作
    if (workspace) {
      actions.push({
        id: 'open_in_explorer',
        title: '在文件浏览器中打开',
        description: `在文件浏览器中打开: ${workspace}`,
        icon: '🔍',
      });

      // 检查是否为Git仓库，如果是，检查是否有未提交的更改
      if (await GitHelper.isGitRepository(workspace)) {
        // 添加Git相关动作
        const hasChanges = await GitHelper.hasUncommittedChanges(workspace);
        if (hasChanges) {
          // 当前分支名称
          const branch = await GitHelper.getCurrentBranch(workspace);
          actions.push({
            id: 'git_commit_push',
            title: 'Git提交并推送',
            description: `将未提交的更改提交并推送到${branch}分支`,
            icon: '🚀',
          });
        }
      }
    }

    // 如果有关键词，过滤匹配的动作
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      const filteredActions = actions.filter(
        (action) =>
          action.title.toLowerCase().includes(lowerKeyword) ||
          action.description.toLowerCase().includes(lowerKeyword)
      );

      logger.info(`过滤后返回 ${filteredActions.length} 个动作`);
      return filteredActions;
    }

    return actions;
  },

  /**
   * 执行插件动作
   * 从缓存中获取工作区路径
   */
  async executeAction(action: Action): Promise<ActionResult> {
    logger.info(`执行动作: ${action.id} (${action.title})`);

    try {
      // 从缓存中获取工作区路径
      // 不需要提供应用ID，会自动使用缓存中的当前应用ID
      const workspace = WorkspaceCache.getWorkspace();

      if (!workspace) {
        const currentApp = WorkspaceCache.getCurrentApp();
        logger.error(`无法从缓存获取工作区路径，应用ID: ${currentApp}`);

        if (currentApp) {
          // 尝试重新获取工作区路径
          const isVSCode =
            currentApp.toLowerCase().includes('code') ||
            currentApp.toLowerCase().includes('vscode');
          const isCursor = currentApp.toLowerCase().includes('cursor');

          if (isVSCode || isCursor) {
            const freshWorkspace = await (isCursor
              ? cursorService.getWorkspace()
              : vscodeService.getWorkspace());

            if (freshWorkspace) {
              // 重新缓存工作区路径
              await WorkspaceCache.saveWorkspace(currentApp, freshWorkspace);

              // 继续执行动作
              return this.executeAction(action);
            }
          }
        }

        return { message: `无法获取工作区路径，请重新打开IDE` };
      }

      switch (action.id) {
        case 'show_workspace': {
          return { message: `当前工作空间: ${workspace}` };
        }

        case 'open_in_explorer': {
          const result = await FileSystemHelper.openInExplorer(workspace);
          return { message: result };
        }

        case 'git_commit_push': {
          const result = await GitHelper.autoCommitAndPush(workspace);
          return { message: result };
        }

        default:
          return { message: `未知的动作: ${action.id}` };
      }
    } catch (error: any) {
      logger.error(`执行动作失败:`, error);
      return { message: `执行失败: ${error.message || '未知错误'}` };
    }
  },
};

// 插件初始化输出
logger.info(`IDE工作空间插件已加载: ${plugin.name} v${plugin.version}`);

// 导出插件
export = plugin;
