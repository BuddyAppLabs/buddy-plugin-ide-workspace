import { SwitchBranchActionBase } from './switch-branch-action-base';

/**
 * 切换到main分支动作
 */
export class SwitchToMainAction extends SwitchBranchActionBase {
    constructor() {
        super('切换到main分支', 'main');
    }

    getActionId(): string {
        return 'switch-to-main';
    }
} 