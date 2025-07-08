import { ActionResult, SuperAction, SuperContext } from '@coffic/buddy-it';
import { BaseAction } from './base-action';

/**
 * 显示工作空间信息动作
 */
export class ShowWorkspaceAction extends BaseAction {
    constructor() {
        super('显示工作空间');
    }

    async getAction(workspace?: string): Promise<SuperAction | null> {
        const workspaceInfo = workspace
            ? `当前工作空间: ${workspace}`
            : `未能获取到工作空间信息`;

        return {
            id: 'show_workspace',
            description: workspaceInfo,
        };
    }

    async execute(context: SuperContext, workspace: string): Promise<ActionResult> {
        this.logger.info(`显示工作空间信息: ${workspace}`);
        return {
            success: true,
            message: `当前工作空间: ${workspace}`
        };
    }
} 