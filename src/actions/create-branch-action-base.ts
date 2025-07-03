import { SuperAction, ExecuteActionArgs, ExecuteResult } from '@coffic/buddy-types';
import { BaseAction } from './base-action';
import { IDEServiceFactory } from '../services/ide_factory';
import { GitHelper } from '../utils/git-helper';

/**
 * 创建分支动作基类
 */
export abstract class CreateBranchActionBase extends BaseAction {
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
        const isGitRepo = await IDEServiceFactory.isGitRepository(workspace);
        if (!isGitRepo) {
            return null;
        }

        // 检查分支是否已存在
        const exists = await GitHelper.branchExists(workspace, this.branchName);
        if (exists) {
            return null;
        }

        return {
            id: `create_${this.branchName}_branch`,
            description: `创建${this.branchName}分支`,
            icon: '🌿',
            globalId: '',
            pluginId: '',
        };
    }

    async execute(args: ExecuteActionArgs, workspace: string): Promise<ExecuteResult> {
        try {
            const result = await GitHelper.createBranch(workspace, this.branchName);
            return {
                success: true,
                message: result
            };
        } catch (error: any) {
            this.logger.error(`创建${this.branchName}分支失败:`, error);
            return {
                success: false,
                message: `创建失败: ${error.message || '未知错误'}`
            };
        }
    }
} 