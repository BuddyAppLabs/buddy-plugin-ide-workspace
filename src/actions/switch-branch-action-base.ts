import { ActionResult, SuperAction, SuperContext } from '@coffic/buddy-it';
import { BaseAction } from './base-action';
import { GitHelper } from '../utils/git-helper';

/**
 * 切换分支动作基类
 */
export abstract class SwitchBranchActionBase extends BaseAction {
    protected branchName: string;

    constructor(description: string, branchName: string) {
        super(description);
        this.branchName = branchName;
    }

    async getAction(workspace?: string): Promise<SuperAction | null> {
        if (!workspace) {
            return null;
        }

        // 检查是否为Git仓库
        const isGitRepo = await GitHelper.isGitRepository(workspace);
        if (!isGitRepo) {
            return null;
        }

        // 检查分支是否存在
        const exists = await GitHelper.branchExists(workspace, this.branchName);
        if (!exists) {
            return null;
        }

        // 检查是否已经在目标分支上
        const currentBranch = await GitHelper.getCurrentBranch(workspace);
        if (currentBranch === this.branchName) {
            return null;
        }

        return {
            id: this.getActionId(),
            description: `切换到${this.branchName}分支`,
        };
    }

    async execute(context: SuperContext, workspace: string): Promise<ActionResult> {
        try {
            const result = await GitHelper.switchBranch(workspace, this.branchName);
            return {
                success: true,
                message: result
            };
        } catch (error: any) {
            this.logger.error(`切换到${this.branchName}分支失败:`, error);
            return {
                success: false,
                message: `切换失败: ${error.message || '未知错误'}`
            };
        }
    }

    abstract getActionId(): string;
} 