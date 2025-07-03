import { OpenProjectActionBase } from './open-project-action';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * 在浏览器中打开项目
 */
export class OpenInBrowserAction extends OpenProjectActionBase {
    constructor() {
        super('浏览器');
    }

    isAvailable(projectType: { isXcode: boolean; hasGithub: boolean; githubUrl: string | null }): boolean {
        return projectType.hasGithub && !!projectType.githubUrl;
    }

    getActionId(): string {
        return 'open_in_browser';
    }

    getActionIcon(): string {
        return '🌐';
    }

    async executeOpen(workspace: string, projectType: { isXcode: boolean; hasGithub: boolean; githubUrl: string | null }): Promise<string> {
        try {
            if (!projectType.githubUrl) {
                throw new Error('未找到GitHub仓库URL');
            }
            await execAsync(`open ${projectType.githubUrl}`);
            return '已在浏览器中打开项目';
        } catch (error: any) {
            throw new Error('打开浏览器失败: ' + error.message);
        }
    }
}
