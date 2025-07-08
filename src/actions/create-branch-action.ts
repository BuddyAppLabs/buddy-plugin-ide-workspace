import { ActionResult, SuperAction, SuperContext } from '@coffic/buddy-it';
import { BaseAction } from './base-action';
import { IDEServiceFactory } from '../services/ide_factory';

/**
 * 创建Git分支动作基类
 */
export abstract class CreateBranchActionBase extends BaseAction {
    protected branchName: string;

    constructor(name: string, branchName: string) {
        super(name);
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
        const exists = await IDEServiceFactory.branchExists(workspace, this.branchName);
        if (exists) {
            return null;
        }

        return {
            id: `create_${this.branchName}_branch`,
            description: `创建${this.branchName}分支`,
        };
    }

    async execute(context: SuperContext, workspace: string): Promise<ActionResult> {
        try {
            const result = await IDEServiceFactory.createBranch(workspace, this.branchName);
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
}

/**
 * 创建dev分支动作
 */
export class CreateDevBranchAction extends CreateBranchActionBase {
    constructor() {
        super('创建dev分支', 'dev');
    }
}

/**
 * 创建main分支动作
 */
export class CreateMainBranchAction extends CreateBranchActionBase {
    constructor() {
        super('创建main分支', 'main');
    }
} 