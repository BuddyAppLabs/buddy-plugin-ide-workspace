import { CreateBranchActionBase } from './create-branch-action-base';

/**
 * 创建dev分支动作
 */
export class CreateDevBranchAction extends CreateBranchActionBase {
    constructor() {
        super('创建dev分支', 'dev');
    }
} 