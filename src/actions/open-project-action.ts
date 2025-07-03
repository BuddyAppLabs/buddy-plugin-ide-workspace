import { SuperAction, ExecuteActionArgs, ExecuteResult } from '@coffic/buddy-types';
import { BaseAction } from './base-action';
import { IDEServiceFactory } from '../services/ide_factory';

/**
 * 打开项目动作基类
 */
export abstract class OpenProjectActionBase extends BaseAction {
    constructor(description: string) {
        super(description);
    }

    abstract isAvailable(projectType: { isXcode: boolean; hasGithub: boolean; githubUrl: string | null }): boolean;
    abstract getActionId(): string;
    abstract getActionIcon(): string;
    abstract executeOpen(workspace: string, projectType: { isXcode: boolean; hasGithub: boolean; githubUrl: string | null }): Promise<string>;

    async getAction(workspace?: string): Promise<SuperAction | null> {
        if (!workspace) {
            return null;
        }

        const projectType = await IDEServiceFactory.getProjectType(workspace);
        if (!this.isAvailable(projectType)) {
            return null;
        }

        return {
            id: this.getActionId(),
            description: `在${this.name}中打开`,
            icon: this.getActionIcon(),
            globalId: '',
            pluginId: '',
        };
    }

    async execute(args: ExecuteActionArgs, workspace: string): Promise<ExecuteResult> {
        try {
            const projectType = await IDEServiceFactory.getProjectType(workspace);
            const result = await this.executeOpen(workspace, projectType);
            return {
                success: true,
                message: result
            };
        } catch (error: any) {
            this.logger.error(`在${this.name}中打开失败:`, error);
            return {
                success: false,
                message: error.message
            };
        }
    }
} 