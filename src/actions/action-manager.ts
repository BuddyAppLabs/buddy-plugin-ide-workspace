import { SuperAction, ExecuteActionArgs, ExecuteResult } from '@coffic/buddy-types';
import { BaseAction } from './base-action';
import { ShowWorkspaceAction } from './show-workspace-action';
import { OpenExplorerAction } from './open-explorer-action';
import { GitCommitPushAction } from './git-commit-push-action';
import { AICommitAction } from './ai-commit-action';
import { AICommitEnAction } from './ai-commit-en-action';
import { ShowCurrentBranchAction } from './show-current-branch-action';
import { CreateDevBranchAction } from './create-dev-branch-action';
import { CreateMainBranchAction } from './create-main-branch-action';
import { MergeDevToMainAction } from './merge-dev-to-main-action';
import { OpenInBrowserAction } from './open-in-browser-action';
import { OpenInTerminalAction } from './open-in-terminal-action';
import { OpenInXcodeAction } from './open-in-xcode-action';
import { GitPushAction } from './git-push-action';
import { SwitchToDevAction } from './switch-to-dev-action';
import { SwitchToMainAction } from './switch-to-main-action';
import { Logger } from '../utils/logger';
import { OpenInGitHubDesktopAction } from './open-in-github-desktop-action';

/**
 * 动作管理器
 * 负责管理所有动作的注册、获取和执行
 */
export class ActionManager {
    private static instance: ActionManager;
    private actions: BaseAction[] = [];
    private logger: Logger;

    constructor() {
        this.logger = new Logger('ActionManager');
        this.registerActions();
    }

    /**
     * 注册所有动作
     */
    private registerActions(): void {
        this.actions = [
            new ShowWorkspaceAction(),
            new OpenExplorerAction(),
            new GitCommitPushAction(),
            new AICommitAction(),
            new AICommitEnAction(),
            // Git相关动作
            new ShowCurrentBranchAction(),
            new CreateDevBranchAction(),
            new CreateMainBranchAction(),
            new MergeDevToMainAction(),
            new GitPushAction(),
            // 打开项目相关动作
            new OpenInGitHubDesktopAction(),
            new OpenInBrowserAction(),
            new OpenInXcodeAction(),
            new OpenInTerminalAction(),
            new SwitchToDevAction(),
            new SwitchToMainAction()
        ];

        this.logger.info(`已注册 ${this.actions.length} 个动作`);
    }

    /**
     * 获取所有可用的动作
     * @param workspace 工作空间路径
     * @param keyword 关键词过滤
     * @returns 动作列表
     */
    async getActions(workspace?: string, keyword?: string): Promise<SuperAction[]> {
        const availableActions: SuperAction[] = [];

        // 获取所有动作
        for (const action of this.actions) {
            const actionDef = await action.getAction(workspace);
            if (actionDef) {
                // 检查是否匹配关键词
                if (!keyword || this.matchesKeyword(actionDef, keyword)) {
                    availableActions.push(actionDef);
                }
            }
        }

        this.logger.info(`返回 ${availableActions.length} 个可用动作`);
        return availableActions;
    }

    /**
     * 执行指定的动作
     * @param args 执行参数
     * @param workspace 工作空间路径
     * @returns 执行结果
     */
    async executeAction(args: ExecuteActionArgs, workspace: string): Promise<ExecuteResult> {
        // 查找对应的动作
        for (const action of this.actions) {
            const actionDef = await action.getAction(workspace);
            if (actionDef && actionDef.id === args.actionId) {
                return await action.execute(args, workspace);
            }
        }

        // 未找到对应的动作
        this.logger.error(`未找到动作: ${args.actionId}`);
        return {
            success: false,
            message: `未知的动作: ${args.actionId}`
        };
    }

    /**
     * 检查动作是否匹配关键词
     * @param action 动作对象
     * @param keyword 关键词
     * @returns 是否匹配
     */
    private matchesKeyword(action: SuperAction, keyword: string): boolean {
        if (!keyword) return true;
        const lowerKeyword = keyword.toLowerCase();
        return action.description.toLowerCase().includes(lowerKeyword);
    }
} 