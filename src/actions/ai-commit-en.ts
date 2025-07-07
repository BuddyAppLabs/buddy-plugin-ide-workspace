import { AICommitBaseAction } from './ai-commit-base';

/**
 * AI智能Git提交和推送动作(英文版)
 */
export class AICommitEnAction extends AICommitBaseAction {
    constructor() {
        super(
            'en',
            '使用AI智能生成英文commit message并推送到{branch}分支',
            'git_ai_commit_push_en',
            '🤖');
    }
} 