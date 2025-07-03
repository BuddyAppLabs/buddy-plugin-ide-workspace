import { OpenProjectActionBase } from './open-project-action';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * 在GitHub Desktop中打开项目
 */
export class OpenInGitHubDesktopAction extends OpenProjectActionBase {
    constructor() {
        super('GitHub Desktop');
    }

    isAvailable(projectType: { isXcode: boolean; hasGithub: boolean; githubUrl: string | null }): boolean {
        return true;
    }

    getActionId(): string {
        return 'open_in_github_desktop';
    }

    getActionIcon(): string {
        return '🖥️';
    }

    async executeOpen(workspace: string): Promise<string> {
        try {
            await execAsync(`github .`, { cwd: workspace });
            return '已在GitHub Desktop中打开项目';
        } catch (error: any) {
            throw new Error('打开GitHub Desktop失败，请确保已安装GitHub Desktop');
        }
    }
}
