import { CreateBranchActionBase } from './create-branch-action-base';

/**
 * 创建main分支动作
 */
export class CreateMainBranchAction extends CreateBranchActionBase {
    constructor() {
        super('创建main分支', 'main');
    }
} 