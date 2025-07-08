import { ActionResult, SuperAction, SuperContext } from '@coffic/buddy-it';
import { BaseAction } from './base-action';
import { IDEServiceFactory } from '../services/ide_factory';

/**
 * Git提交和推送动作
 */
export class GitCommitPushAction extends BaseAction {
    constructor() {
        super('Git提交推送');
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

        // 检查是否有未提交的更改
        const hasChanges = await IDEServiceFactory.hasUncommittedChanges(workspace);
        if (!hasChanges) {
            return null;
        }

        // 获取当前分支名称
        const branch = await IDEServiceFactory.getCurrentBranch(workspace);

        return {
            id: 'git_commit_push',
            description: `将未提交的更改提交并推送到${branch}分支`,
        };
    }

    async execute(context: SuperContext, workspace: string): Promise<ActionResult> {
        this.logger.info(`执行Git提交和推送: ${workspace}`);

        try {
            const result = await IDEServiceFactory.autoCommitAndPush(workspace);
            return {
                success: true,
                message: result
            };
        } catch (error: any) {
            this.logger.error('Git提交推送失败:', error);
            return {
                success: false,
                message: `提交推送失败: ${error.message || '未知错误'}`
            };
        }
    }
} 