import { SwitchBranchActionBase } from './switch-branch-action-base';

/**
 * 切换到dev分支动作
 */
export class SwitchToDevAction extends SwitchBranchActionBase {
    constructor() {
        super('切换到dev分支', 'dev');
    }

    getActionId(): string {
        return 'switch-to-dev';
    }
} 