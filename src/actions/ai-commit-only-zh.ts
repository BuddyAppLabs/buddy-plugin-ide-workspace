import { ActionResult, SuperContext } from "@coffic/buddy-it";
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
            '🤖',
            'commit'
        );
    }
} 