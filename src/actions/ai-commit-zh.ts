import { AICommitBaseAction } from './ai-commit-base';

/**
 * AI智能Git提交和推送动作(中文版)
 */
export class AICommitZhAction extends AICommitBaseAction {
    constructor() {
        super('zh', '使用AI智能生成中文commit message并推送到{branch}分支', 'git_ai_commit_push_cn', '🤖', 'commitAndPush');
    }
}

