import { SuperAction, ExecuteActionArgs, ExecuteResult } from '@coffic/buddy-types';
import { Logger } from '../utils/logger';

/**
 * 动作基类
 * 所有具体的动作都应该继承此基类
 */
export abstract class BaseAction {
    protected logger: Logger;

    constructor(protected name: string) {
        this.logger = new Logger(`Action: ${name}`);
    }

    /**
     * 获取动作定义
     * @param workspace 工作空间路径
     * @returns SuperAction对象
     */
    abstract getAction(workspace?: string): Promise<SuperAction | null>;

    /**
     * 执行动作
     * @param args 执行参数
     * @param workspace 工作空间路径
     * @returns 执行结果
     */
    abstract execute(args: ExecuteActionArgs, workspace: string): Promise<ExecuteResult>;

    /**
     * 检查动作是否匹配关键词
     * @param action 动作对象
     * @param keyword 关键词
     * @returns 是否匹配
     */
    protected matchesKeyword(action: SuperAction, keyword: string): boolean {
        if (!keyword) return true;
        const lowerKeyword = keyword.toLowerCase();
        return action.description.toLowerCase().includes(lowerKeyword);
    }
} 