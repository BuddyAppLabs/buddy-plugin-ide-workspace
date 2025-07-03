import { SuperAction, ExecuteActionArgs, ExecuteResult } from '@coffic/buddy-types';
import { BaseAction } from './base-action';
import { IDEServiceFactory } from '../services/ide_factory';

/**
 * 显示当前Git分支动作
 */
export class ShowCurrentBranchAction extends BaseAction {
    constructor() {
        super('显示当前分支');
    }

    async getAction(workspace?: string): Promise<SuperAction | null> {
        if (!workspace) {
            return null;
        }

        // 检查是否为Git仓库
        const isGitRepo = await IDEServiceFactory.isGitRepository(workspace);
        if (!isGitRepo) {
            return null;
        }

        // 获取当前分支名称
        const branch = await IDEServiceFactory.getCurrentBranch(workspace);

        return {
            id: 'show_current_branch',
            description: `当前分支: ${branch}`,
            icon: '🔖',
            globalId: '',
            pluginId: '',
        };
    }

    async execute(args: ExecuteActionArgs, workspace: string): Promise<ExecuteResult> {
        const branch = await IDEServiceFactory.getCurrentBranch(workspace);
        return {
            success: true,
            message: `当前所在分支: ${branch}`
        };
    }
} 