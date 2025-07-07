import { ExecuteActionArgs } from "@coffic/buddy-types";
import { AICommitBaseAction } from "./ai-commit-base";

/**
 * AI智能Git提交（仅提交，不推送，中文版）
 */
export class AICommitOnlyZhAction extends AICommitBaseAction {
    constructor() {
        super(
            'zh',
            '使用AI智能生成中文commit message并提交到{branch}分支',
            'git_ai_commit_only_cn',
            '🤖');
    }

    async execute(args: ExecuteActionArgs, workspace: string) {
        this.logger.info(`执行AI智能Git仅提交(${this.config.name}): ${workspace}`);
        try {
            if (!args.context?.ai?.generateText) {
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
            const aiPrompt = this.buildAIPrompt(gitDiff);
            this.logger.info(`正在使用AI生成${this.config.name} commit message...`);
            const aiCommitMessage = await args.context.ai.generateText(aiPrompt);
            if (!aiCommitMessage || aiCommitMessage.trim().length === 0) {
                return {
                    success: false,
                    message: 'AI生成commit message失败'
                };
            }
            this.logger.info(`AI生成的commit message: ${aiCommitMessage}`);
            // 只提交不推送
            const result = await this.commitOnly(workspace, aiCommitMessage.trim());
            return {
                success: true,
                message: `AI智能提交成功（仅提交）！\n📝 Commit Message: ${aiCommitMessage.trim()}\n✅ ${result}`
            };
        } catch (error: any) {
            this.logger.error('AI智能Git仅提交失败:', error);
            return {
                success: false,
                message: `AI智能仅提交失败: ${error.message || '未知错误'}`
            };
        }
    }
} 