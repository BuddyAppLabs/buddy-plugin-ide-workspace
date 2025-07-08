import { ActionResult, SuperAction, SuperContext } from '@coffic/buddy-it';
import { BaseAction } from './base-action';
import { IDEServiceFactory } from '../services/ide_factory';

/**
 * 在文件浏览器中打开工作空间动作
 */
export class OpenExplorerAction extends BaseAction {
    constructor() {
        super('打开文件浏览器');
    }

    async getAction(workspace?: string): Promise<SuperAction | null> {
        if (!workspace) {
            return null;
        }

        return {
            id: 'open_in_explorer',
            description: `在文件浏览器中打开: ${workspace}`,
        };
    }

    async execute(context: SuperContext, workspace: string): Promise<ActionResult> {
        this.logger.info(`在文件浏览器中打开: ${workspace}`);

        try {
            const result = await IDEServiceFactory.openInExplorer(workspace);
            return {
                success: true,
                message: result
            };
        } catch (error: any) {
            this.logger.error('打开文件浏览器失败:', error);
            return {
                success: false,
                message: `打开失败: ${error.message || '未知错误'}`
            };
        }
    }
} 