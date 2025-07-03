import { SuperAction, ExecuteActionArgs, ExecuteResult } from '@coffic/buddy-types';
import { BaseAction } from './base-action';
import { GitHelper } from '../utils/git-helper';

/**
 * 将dev分支合并到main分支的动作
 */
export class MergeDevToMainAction extends BaseAction {
    constructor() {
        super('合并dev到main分支');
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

        // 检查dev分支是否存在
        const devExists = await GitHelper.branchExists(workspace, 'dev');
        if (!devExists) {
            return null;
        }

        // 检查main分支是否存在
        const mainExists = await GitHelper.branchExists(workspace, 'main');
        if (!mainExists) {
            return null;
        }

        return {
            id: 'merge_dev_to_main',
            description: '将dev分支合并到main分支',
            icon: '🔄',
            globalId: '',
            pluginId: '',
        };
    }

    async execute(args: ExecuteActionArgs, workspace: string): Promise<ExecuteResult> {
        try {
            // 执行合并（mergeBranch方法会自动切换到目标分支）
            const result = await GitHelper.mergeBranch(workspace, 'dev', 'main');
            return {
                success: true,
                message: result
            };
        } catch (error: any) {
            this.logger.error('合并分支失败:', error);
            return {
                success: false,
                message: `合并失败: ${error.message || '未知错误'}`
            };
        }
    }
} 