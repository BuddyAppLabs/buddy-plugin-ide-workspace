import { OpenProjectActionBase } from './open-project-action';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * 在Xcode中打开项目
 */
export class OpenInXcodeAction extends OpenProjectActionBase {
    constructor() {
        super('Xcode');
    }

    isAvailable(projectType: { isXcode: boolean; hasGithub: boolean; githubUrl: string | null }): boolean {
        return projectType.isXcode;
    }

    getActionId(): string {
        return 'open_in_xcode';
    }

    getActionIcon(): string {
        return '📱';
    }

    async executeOpen(workspace: string): Promise<string> {
        try {
            await execAsync(`open -a Xcode .`, { cwd: workspace });
            return '已在Xcode中打开项目';
        } catch (error: any) {
            throw new Error('打开Xcode失败: ' + error.message);
        }
    }
}
