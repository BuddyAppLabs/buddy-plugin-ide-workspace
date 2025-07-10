import { ActionResult, SuperAction, SuperContext } from '@coffic/buddy-it';
import { BaseAction } from './base-action';
import { IDEServiceFactory } from '../services/ide_factory';
import { exec } from 'child_process';
import { promisify } from 'util';
import { GitHelper } from '../utils/git-helper';

const execAsync = promisify(exec);

export interface CommitType {
    emoji: string;
    type: string;
    description: string;  // 使用中文示例描述
}

export const COMMIT_TYPES: CommitType[] = [
    { emoji: '🐛', type: 'Bugfix', description: '修复xxx问题' },
    { emoji: '🎨', type: 'Chore', description: '代码整理和重构' },
    { emoji: '👷', type: 'CI', description: 'CI相关修改' },
    { emoji: '🔧', type: 'Config', description: '配置文件修改' },
    { emoji: '🐳', type: 'Docker', description: 'Docker相关修改' },
    { emoji: '📖', type: 'Document', description: '文档更新' },
    { emoji: '🆕', type: 'Feature', description: '新功能实现' },
    { emoji: '🎉', type: 'FirstCommit', description: '项目初始化' },
    { emoji: '🌍', type: 'I18n', description: '国际化相关' },
    { emoji: '🐎', type: 'Improve', description: '性能优化' },
    { emoji: '🔖', type: 'Release', description: '版本发布' },
    { emoji: '🗑️', type: 'Trash', description: '删除文件或代码' },
    { emoji: '✏️', type: 'Typo', description: '修正拼写错误' },
    { emoji: '💄', type: 'UI', description: 'UI和样式更新' },
    { emoji: '📦', type: 'PackageUpdate', description: '包管理更新' },
    { emoji: '🧪', type: 'Test', description: '测试相关' }
];

export interface LanguageConfig {
    name: string;
    language: string;  // 输出语言：'中文' 或 'English'
}

// 统一的提示词模板
export const PROMPT_TEMPLATE = `请根据以下Git变更信息，生成一个简洁、清晰的commit message。

要求：
1. 使用{language}描述
2. 不超过80个字符
3. 必须采用以下固定格式之一：英文类型 + 冒号 + 空格 + {language}描述
{types}
4. 选择最符合变更内容的类型
5. {language}描述要具体且有意义，参考示例但不要直接使用
6. 只返回commit message本身，不要其他内容

Git变更信息：
{diff}

Commit Message:`;

export const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
    zh: {
        name: 'AI智能Git提交(中文)',
        language: '中文'
    },
    en: {
        name: 'AI智能Git提交(英文)',
        language: 'English'
    }
};

export type CommitActionType = 'commit' | 'commitAndPush';

/**
 * AI智能Git提交和推送动作基类
 */
export class AICommitBaseAction extends BaseAction {
    protected config: LanguageConfig;
    protected description: string;
    protected id: string;
    protected icon: string;
    protected actionType: CommitActionType;

    constructor(language: string, description: string, id: string, icon: string, actionType: CommitActionType = 'commitAndPush') {
        const config = LANGUAGE_CONFIGS[language];
        if (!config) {
            throw new Error(`Unsupported language: ${language}`);
        }
        super(config.name);
        this.config = config;
        this.description = description;
        this.id = id;
        this.icon = icon;
        this.actionType = actionType;
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
            id: this.id,
            description: this.description.replace('{branch}', branch),
        };
    }

    async execute(context: SuperContext, workspace: string): Promise<ActionResult> {
        this.logger.info(`执行AI智能Git提交动作(${this.config.name}): ${workspace}`);
        try {
            if (!context.ai?.generateText) {
                return {
                    success: false,
                    message: '缺少AI功能支持，无法生成智能commit message'
                };
            }
            const gitDiff = await this.getGitDiff(workspace);
            if (!gitDiff) {
                return {
                    success: false,
                    message: '无法获取Git变更信息'
                };
            }

            // 使用AI生成commit message
            const aiPrompt = this.buildAIPrompt(gitDiff);
            this.logger.info(`正在使用AI生成${this.config.name} commit message...`);

            let aiCommitMessage = await context.ai.generateText(aiPrompt);

            if (!aiCommitMessage || aiCommitMessage.trim().length === 0) {
                return {
                    success: false,
                    message: 'AI生成commit message失败'
                };
            }
            aiCommitMessage = this.addEmojiToCommitMessage(aiCommitMessage.trim());
            this.logger.info(`AI生成的commit message: ${aiCommitMessage}`);
            let result: string;
            if (this.actionType === 'commit') {
                result = await this.commitOnly(workspace, aiCommitMessage);
            } else {
                result = await this.commitAndPush(workspace, aiCommitMessage);
            }
            return {
                success: true,
                message: `AI智能提交成功！`
            };
        } catch (error: any) {
            this.logger.error('AI智能Git提交动作失败:', error);
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
    protected buildAIPrompt(gitDiff: string): string {
        // 构建类型列表
        const typesList = COMMIT_TYPES.map(type =>
            `   - ${type.type}: ${type.description}`
        ).join('\n');

        return PROMPT_TEMPLATE
            .replace(/{language}/g, this.config.language)
            .replace('{types}', typesList)
            .replace('{diff}', gitDiff);
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
    protected async getGitDiff(workspace: string): Promise<string | null> {
        return await this.getGitDiffInfo(workspace);
    }

    /**
     * 只执行提交，不推送
     */
    protected async commitOnly(workspace: string, commitMessage: string): Promise<string> {
        // 添加所有更改到暂存区并提交
        return await GitHelper.commitOnly(workspace, commitMessage);
    }

    /**
     * 给 commit message 自动加上 emoji 前缀
     */
    protected addEmojiToCommitMessage(commitMessage: string): string {
        // 匹配类型（如 Feature:、Bugfix: 等）
        const match = commitMessage.match(/^([A-Za-z]+):/);
        if (!match) return commitMessage; // 没有类型，直接返回

        const type = match[1];
        const found = COMMIT_TYPES.find(t => t.type.toLowerCase() === type.toLowerCase());
        if (!found) return commitMessage; // 没有找到对应类型，直接返回

        // 替换为 emoji + 类型
        return commitMessage.replace(
            /^([A-Za-z]+:)/,
            `${found.emoji} $1`
        );
    }
} 