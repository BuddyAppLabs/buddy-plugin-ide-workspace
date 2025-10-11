import { ActionResult, SuperContext } from "@coffic/buddy-it";
import { AICommitBaseAction } from "./ai-commit-base";

/**
 * AI智能Git提交（仅提交，不推送，英文版）
 */
export class AICommitOnlyEnAction extends AICommitBaseAction {
    constructor() {
        super(
            'en',
            '使用AI智能生成英文commit message并提交到{branch}分支',
            'git_ai_commit_only_en',
            '🤖',
            'commit'
        );
    }
}