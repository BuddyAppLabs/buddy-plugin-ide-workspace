import { SuperAction, ExecuteActionArgs, ExecuteResult } from '@coffic/buddy-types';
import { BaseAction } from './base-action';
import { IDEServiceFactory } from '../services/ide_factory';
import { GitHelper } from '../utils/git-helper';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * AI智能Git提交和推送动作
 */
export class GitAICommitAction extends BaseAction {
    constructor() {
        super('AI智能Git提交');
    }

    async getAction(workspace?: string): Promise<SuperAction | null> {
        if (!workspace) {
            return null;
        }

        // 检查是否为Git仓库
        const isGitRepo = await IDEServiceFactory.isGitRepository(workspace);
        if (!isGitRepo) {
            return null;
        }

        // 检查是否有未提交的更改
        const hasChanges = await IDEServiceFactory.hasUncommittedChanges(workspace);
        if (!hasChanges) {
            return null;
        }

        // 获取当前分支名称
        const branch = await IDEServiceFactory.getCurrentBranch(workspace);

        return {
            id: 'git_ai_commit_push',
            description: `🤖 使用AI智能生成commit message并推送到${branch}分支`,
            icon: '🤖',
            globalId: '',
            pluginId: '',
        };
    }

    async execute(args: ExecuteActionArgs, workspace: string): Promise<ExecuteResult> {
        this.logger.info(`执行AI智能Git提交和推送: ${workspace}`);

        try {
            // 检查是否有SuperContext
            if (!args.context?.ai?.generateText) {
                return {
                    success: false,
                    message: '缺少AI功能支持，无法生成智能commit message'
                };
            }

            // 获取Git变更详情
            const gitDiff = await this.getGitDiff(workspace);
            if (!gitDiff) {
                return {
                    success: false,
                    message: '无法获取Git变更信息'
                };
            }

            // 使用AI生成commit message
            const aiPrompt = this.buildAIPrompt(gitDiff);
            this.logger.info('正在使用AI生成commit message...');

            const aiCommitMessage = await args.context.ai.generateText(aiPrompt);

            if (!aiCommitMessage || aiCommitMessage.trim().length === 0) {
                return {
                    success: false,
                    message: 'AI生成commit message失败'
                };
            }

            this.logger.info(`AI生成的commit message: ${aiCommitMessage}`);

            // 执行提交和推送
            const result = await this.commitAndPush(workspace, aiCommitMessage.trim());

            return {
                success: true,
                message: `AI智能提交成功！\n📝 Commit Message: ${aiCommitMessage.trim()}\n✅ ${result}`
            };

        } catch (error: any) {
            this.logger.error('AI智能Git提交推送失败:', error);
            return {
                success: false,
                message: `AI智能提交失败: ${error.message || '未知错误'}`
            };
        }
    }

    /**
 * 获取Git变更详情
 */
    private async getGitDiffInfo(workspace: string): Promise<string | null> {
        try {
            // 获取变更状态
            const { stdout: statusOutput } = await execAsync('git status --porcelain', { cwd: workspace });

            // 获取变更差异（简化版）
            const { stdout: diffOutput } = await execAsync('git diff --cached --name-status', { cwd: workspace });

            // 如果没有已暂存的文件，获取工作区变更
            let changes = diffOutput;
            if (!changes || changes.trim().length === 0) {
                const { stdout: workingChanges } = await execAsync('git diff --name-status', { cwd: workspace });
                changes = workingChanges;
            }

            return `状态信息:\n${statusOutput}\n\n变更文件:\n${changes}`;
        } catch (error: any) {
            this.logger.error('获取Git差异失败:', error);
            return null;
        }
    }

    /**
     * 构建AI提示词
     */
    private buildAIPrompt(gitDiff: string): string {
        return `请根据以下Git变更信息，生成一个简洁、清晰的commit message。

要求：
1. 使用中文
2. 不超过50个字符
3. 采用约定式提交格式，如：feat: 、fix: 、docs: 、style: 、refactor: 、test: 、chore: 等
4. 描述要具体且有意义
5. 只返回commit message本身，不要其他内容

Git变更信息：
${gitDiff}

Commit Message:`;
    }

    /**
 * 执行提交和推送
 */
    private async commitAndPush(workspace: string, commitMessage: string): Promise<string> {
        try {
            // 添加所有更改到暂存区
            await execAsync('git add .', { cwd: workspace });

            // 提交更改
            await execAsync(`git commit -m "${commitMessage}"`, { cwd: workspace });

            // 推送到远程仓库
            await execAsync('git push', { cwd: workspace });

            return '代码已成功提交并推送到远程仓库';
        } catch (error: any) {
            this.logger.error('Git提交推送失败:', error);
            throw new Error(`Git操作失败: ${error.message}`);
        }
    }

    /**
     * 获取Git差异信息
     */
    private async getGitDiff(workspace: string): Promise<string | null> {
        return await this.getGitDiffInfo(workspace);
    }
} 