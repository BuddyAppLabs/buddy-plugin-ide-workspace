import { OpenProjectActionBase } from './open-project-action';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * 在终端中打开项目
 */
export class OpenInTerminalAction extends OpenProjectActionBase {
    constructor() {
        super('终端');
    }

    isAvailable(): boolean {
        return true; // 所有项目都可以在终端中打开
    }

    getActionId(): string {
        return 'open_in_terminal';
    }

    getActionIcon(): string {
        return '⌨️';
    }

    async executeOpen(workspace: string): Promise<string> {
        try {
            // 使用默认终端打开
            await execAsync(`open -a Terminal ${workspace}`);
            return '已在终端中打开项目';
        } catch (error: any) {
            throw new Error('打开终端失败: ' + error.message);
        }
    }
}
