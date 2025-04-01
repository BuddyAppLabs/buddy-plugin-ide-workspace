import { BaseIDEService } from './base';
import { VSCodeService } from './vscode';
import { CursorService } from './cursor';
import { TraeService } from './trae';
import chalk from 'chalk';
import { FileSystemHelper } from '../utils/file-system-helper';
import { GitHelper } from '../utils/git-helper';
import fs from 'fs';
import path from 'path';
import os from 'os';

interface Workspace {
    name: string;
    path: string;
}

/**
 * IDE服务工厂
 * 用于创建不同IDE的服务实例
 */
export class IDEServiceFactory {
    private static readonly CACHE_DIR = path.join(
        os.homedir(),
        '.coffic',
        'ide-workspace'
    );
    private static readonly CACHE_FILE = path.join(
        IDEServiceFactory.CACHE_DIR,
        'workspace.json'
    );
    private static readonly CURRENT_APP_KEY = '_current_app_';

    /**
     * 清理工作区路径
     * 去除file://前缀和URL编码
     */
    private static cleanWorkspacePath(workspace: string | null): string | null {
        if (!workspace) return null;

        // 去除file://前缀
        let cleanPath = workspace.replace(/^file:\/\//, '');

        // 处理URL编码
        try {
            cleanPath = decodeURIComponent(cleanPath);
        } catch (e) {
            console.error('解码工作区路径失败:', e);
        }

        return cleanPath;
    }

    /**
     * 保存当前应用ID到缓存
     * @param appId 应用标识符
     */
    static async saveCurrentApp(appId: string): Promise<void> {
        try {
            // 确保缓存目录存在
            if (!fs.existsSync(this.CACHE_DIR)) {
                fs.mkdirSync(this.CACHE_DIR, { recursive: true });
            }

            // 读取现有缓存
            let cacheData: Record<string, any> = {};
            if (fs.existsSync(this.CACHE_FILE)) {
                const content = fs.readFileSync(this.CACHE_FILE, 'utf8');
                try {
                    cacheData = JSON.parse(content);
                } catch (e) {
                    console.error('解析缓存文件失败，将重新创建', e);
                }
            }

            // 更新当前应用ID
            cacheData[this.CURRENT_APP_KEY] = appId;

            // 写入缓存文件
            fs.writeFileSync(
                this.CACHE_FILE,
                JSON.stringify(cacheData, null, 2),
                'utf8'
            );
        } catch (error) {
            console.error('保存当前应用ID缓存失败:', error);
        }
    }

    /**
     * 获取当前应用ID
     * @returns 当前应用ID，如果不存在则返回空字符串
     */
    static getCurrentApp(): string {
        try {
            if (!fs.existsSync(this.CACHE_FILE)) {
                return '';
            }

            const content = fs.readFileSync(this.CACHE_FILE, 'utf8');
            const cacheData = JSON.parse(content);

            return cacheData[this.CURRENT_APP_KEY] || '';
        } catch (error) {
            console.error('读取当前应用ID缓存失败:', error);
            return '';
        }
    }

    /**
     * 保存工作区信息到缓存
     * @param appId 应用标识符
     * @param workspace 工作区路径
     */
    static async saveWorkspace(
        appId: string,
        workspace: string | null
    ): Promise<void> {
        try {
            // 确保缓存目录存在
            if (!fs.existsSync(this.CACHE_DIR)) {
                fs.mkdirSync(this.CACHE_DIR, { recursive: true });
            }

            // 清理工作区路径
            const cleanWorkspace = this.cleanWorkspacePath(workspace);

            // 读取现有缓存
            let cacheData: Record<string, any> = {};
            if (fs.existsSync(this.CACHE_FILE)) {
                const content = fs.readFileSync(this.CACHE_FILE, 'utf8');
                try {
                    cacheData = JSON.parse(content);
                } catch (e) {
                    console.error('解析缓存文件失败，将重新创建', e);
                }
            }

            // 更新缓存
            cacheData[appId] = cleanWorkspace;

            // 写入缓存文件
            fs.writeFileSync(
                this.CACHE_FILE,
                JSON.stringify(cacheData, null, 2),
                'utf8'
            );
        } catch (error) {
            console.error('保存工作区缓存失败:', error);
        }
    }

    /**
     * 从缓存中获取工作区信息
     * @param appId 应用标识符，如果为空则尝试使用当前缓存的应用ID
     * @returns 工作区路径，如果不存在则返回null
     */
    static getWorkspace(appId?: string): string | null {
        try {
            if (!fs.existsSync(this.CACHE_FILE)) {
                return null;
            }

            const content = fs.readFileSync(this.CACHE_FILE, 'utf8');
            const cacheData = JSON.parse(content);

            // 如果没有提供appId，使用缓存中的当前应用ID
            const actualAppId = appId || cacheData[this.CURRENT_APP_KEY] || '';
            if (!actualAppId) {
                console.error('未提供应用ID且缓存中没有当前应用ID');
                return null;
            }

            // 获取并确保路径格式正确
            const workspace = cacheData[actualAppId] || null;

            // 如果路径存在但不是有效路径，返回null
            if (workspace && !fs.existsSync(workspace)) {
                console.error(`缓存的工作区路径不存在: ${workspace}`);
                return null;
            }

            return workspace;
        } catch (error) {
            console.error('读取工作区缓存失败:', error);
            return null;
        }
    }

    /**
     * 在文件浏览器中打开工作空间
     * @param workspace 工作空间路径
     * @returns 操作结果
     */
    static async openInExplorer(workspace: string): Promise<string> {
        return FileSystemHelper.openInExplorer(workspace);
    }

    /**
     * 检查是否为Git仓库
     * @param workspace 工作空间路径
     * @returns 是否为Git仓库
     */
    static async isGitRepository(workspace: string): Promise<boolean> {
        return GitHelper.isGitRepository(workspace);
    }

    /**
     * 检查是否有未提交的更改
     * @param workspace 工作空间路径
     * @returns 是否有未提交的更改
     */
    static async hasUncommittedChanges(workspace: string): Promise<boolean> {
        return GitHelper.hasUncommittedChanges(workspace);
    }

    /**
     * 获取当前分支名称
     * @param workspace 工作空间路径
     * @returns 当前分支名称
     */
    static async getCurrentBranch(workspace: string): Promise<string> {
        return GitHelper.getCurrentBranch(workspace);
    }

    /**
     * 自动提交并推送Git更改
     * @param workspace 工作空间路径
     * @returns 操作结果
     */
    static async autoCommitAndPush(workspace: string): Promise<string> {
        return GitHelper.autoCommitAndPush(workspace);
    }

    /**
     * 获取Git仓库信息
     * @param workspace 工作空间路径
     * @returns Git仓库信息
     */
    static async getGitInfo(workspace: string): Promise<{
        isRepo: boolean;
        hasChanges?: boolean;
        branch?: string;
        remoteUrl?: string | null;
    }> {
        // 检查是否为Git仓库
        const isRepo = await GitHelper.isGitRepository(workspace);
        if (!isRepo) {
            return { isRepo };
        }

        // 获取Git信息
        const [hasChanges, branch, remoteUrl] = await Promise.all([
            GitHelper.hasUncommittedChanges(workspace),
            GitHelper.getCurrentBranch(workspace),
            GitHelper.getRemoteUrl(workspace)
        ]);

        return {
            isRepo,
            hasChanges,
            branch,
            remoteUrl
        };
    }

    /**
     * 检测所有工作空间
     * @returns 工作空间列表
     */
    static async detectWorkspaces(): Promise<Workspace[]> {
        console.log(chalk.cyan('\n正在检测IDE工作空间...\n'));
        const workspaces: Workspace[] = [];

        // 获取所有支持的IDE服务
        const supportedIDEs = ['VSCode', 'Cursor', 'Trae'];

        // 遍历检测每个IDE的工作空间
        for (const ideName of supportedIDEs) {
            const ideService = IDEServiceFactory.createService(ideName);
            if (!ideService) continue;

            try {
                const workspace = await ideService.getWorkspace();
                if (workspace) {
                    workspaces.push({
                        name: ideName,
                        path: workspace
                    });
                    console.log(chalk.green(`✅ ${ideName}工作空间: ${workspace}`));
                }
            } catch (err: any) {
                console.log(chalk.red(`❌ ${ideName}服务出错: ${err.message}`));
            }
        }

        return workspaces;
    }

    /**
     * 创建IDE服务实例
     * @param appId IDE应用ID
     * @returns IDE服务实例
     */
    static createService(appId: string): BaseIDEService | null {
        const lowerAppId = appId.toLowerCase();

        // 根据应用ID创建对应的服务实例
        if (lowerAppId.includes('code') || lowerAppId.includes('vscode')) {
            return new VSCodeService('VSCodeService');
        }

        if (lowerAppId.includes('cursor')) {
            return new CursorService('CursorService');
        }

        if (lowerAppId.includes('trae')) {
            return new TraeService('TraEService');
        }

        return null;
    }
}