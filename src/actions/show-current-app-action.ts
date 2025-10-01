import { ActionResult, SuperAction, SuperContext } from '@coffic/buddy-it';
import { BaseAction } from './base-action';
import { IDEServiceFactory } from '../services/ide_factory';

/**
 * 显示当前应用信息动作
 */
export class ShowCurrentAppAction extends BaseAction {
    constructor() {
        super('显示当前应用');
    }

    async getAction(workspace?: string): Promise<SuperAction | null> {
        const currentApp = IDEServiceFactory.getCurrentApp();
        const appInfo = currentApp
            ? `当前应用: ${currentApp}`
            : `未能获取到应用信息`;

        return {
            id: 'show_current_app',
            description: appInfo,
        };
    }

    async execute(context: SuperContext, workspace: string): Promise<ActionResult> {
        const currentApp = IDEServiceFactory.getCurrentApp();
        this.logger.info(`显示当前应用信息: ${currentApp}`);

        if (currentApp) {
            return {
                success: true,
                message: `当前应用: ${currentApp}`
            };
        } else {
            return {
                success: false,
                message: `未能获取到应用信息`
            };
        }
    }
}