import { SuperAction, ExecuteActionArgs, ExecuteResult } from '@coffic/buddy-types';
import { BaseAction } from './base-action';
import { GitHelper } from '../utils/git-helper';

/**
 * 推送当前分支到远程仓库的动作
 */
export class GitPushAction extends BaseAction {
    constructor() {
        super('推送到远程仓库');
    }

    async execute(args: ExecuteActionArgs, workspace: string): Promise<ExecuteResult> {
        try {
            const result = await GitHelper.push(workspace);
            return {
                success: true,
                message: result
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message
            };
        }
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

        // 检查是否有远程仓库
        const remoteUrl = await GitHelper.getRemoteUrl(workspace);
        if (!remoteUrl) {
            return null;
        }

        return {
            id: this.getActionId(),
            description: this.name,
            icon: '🚀',
            globalId: '',
            pluginId: ''
        };
    }

    getActionId(): string {
        return 'git-push';
    }
} 