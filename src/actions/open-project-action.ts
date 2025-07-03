import { SuperAction, ExecuteActionArgs, ExecuteResult } from '@coffic/buddy-types';
import { BaseAction } from './base-action';
import { IDEServiceFactory } from '../services/ide_factory';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

/**
 * 在GitHub Desktop中打开项目
 */
export class OpenInGitHubDesktopAction extends OpenProjectActionBase {
    constructor() {
        super('GitHub Desktop');
    }

    isAvailable(projectType: { isXcode: boolean; hasGithub: boolean; githubUrl: string | null }): boolean {
        return projectType.hasGithub;
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