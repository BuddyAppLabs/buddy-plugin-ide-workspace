import { Logger } from './utils/logger';
import { IDEServiceFactory } from './services/ide_factory';
import { ActionManager } from './action-manager';
import { ActionResult, SuperAction, SuperContext, SuperPlugin } from '@coffic/buddy-it';

const logger = new Logger('IDE工作空间');
const actionManager = new ActionManager();

/**
 * IDE工作空间插件
 * 用于显示当前IDE的工作空间信息
 * 提供打开工作区文件浏览器的功能
 * 工作区路径会被缓存到本地文件
 */
export const plugin: SuperPlugin = {
	name: 'IDE工作空间',
	description: '显示当前IDE的工作空间信息',
	version: '1.0.0',
	author: 'Coffic',
	id: '',
	path: '',
	type: 'user',

	/**
	 * 获取插件提供的动作列表
	 * 
	 * @param context 获取动作列表的参数
	 * @returns 动作列表
	 */
	async getActions(context: SuperContext): Promise<SuperAction[]> {
		logger.info(`获取动作列表，关键词: "${context.keyword}", 应用: "${context.overlaidApp}"`);

		// 检查是否为支持的IDE并创建对应的服务实例
		const ideService = IDEServiceFactory.createService(context.overlaidApp || '');
		if (!ideService) {
			logger.debug('不是支持的IDE，返回空列表');
			return [];
		}

		// 保存当前应用ID到缓存
		await IDEServiceFactory.saveCurrentApp(context.overlaidApp || '');

		// 预先获取工作空间信息
		const workspace = await ideService.getWorkspace();

		// 将工作区路径缓存到文件中
		if (workspace) {
			await IDEServiceFactory.saveWorkspace(context.overlaidApp || '', workspace);
		}

		// 使用ActionManager获取所有可用动作
		const actions = await actionManager.getActions(workspace || undefined, context.keyword);

		logger.info(`返回 ${actions.length} 个动作`);
		return actions;
	},

	/**
	 * 执行插件动作
	 * 
	 * @param args 执行动作的参数
	 * @returns 动作执行结果
	 */
	async executeAction(context: SuperContext): Promise<ActionResult> {
		logger.info(`执行动作: ${context.actionId} (${context.keyword})`);

		try {
			// 从缓存中获取工作区路径
			// 不需要提供应用ID，会自动使用缓存中的当前应用ID
			const workspace = IDEServiceFactory.getWorkspace();

			if (!workspace) {
				const currentApp = IDEServiceFactory.getCurrentApp();
				logger.error(`无法从缓存获取工作区路径，应用ID: ${currentApp}`);

				if (currentApp) {
					// 尝试重新获取工作区路径
					const ideService = IDEServiceFactory.createService(currentApp);
					if (ideService) {
						const freshWorkspace = await ideService.getWorkspace();
						if (freshWorkspace) {
							// 重新缓存工作区路径
							await IDEServiceFactory.saveWorkspace(currentApp, freshWorkspace);

							// 继续执行动作
							return this.executeAction(context);
						}
					}
				}

				return { success: false, message: `无法获取工作区路径，请重新打开IDE` };
			}

			// 使用ActionManager执行动作
			return await actionManager.executeAction(context, workspace);
		} catch (error: any) {
			logger.error(`执行动作失败:`, error);
			return { success: false, message: `执行失败: ${error.message || '未知错误'}` };
		}
	},
};