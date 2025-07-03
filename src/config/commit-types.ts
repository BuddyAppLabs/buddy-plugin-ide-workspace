export interface CommitType {
    emoji: string;
    type: string;
    description: string;  // 使用中文示例描述
}

export const COMMIT_TYPES: CommitType[] = [
    { emoji: '🐛', type: 'Bugfix', description: '修复xxx问题' },
    { emoji: '🎨', type: 'Chore', description: '代码整理和重构' },
    { emoji: '👷', type: 'CI', description: 'CI相关修改' },
    { emoji: '🔧', type: 'Config', description: '配置文件修改' },
    { emoji: '🐳', type: 'Docker', description: 'Docker相关修改' },
    { emoji: '📖', type: 'Document', description: '文档更新' },
    { emoji: '🆕', type: 'Feature', description: '新功能实现' },
    { emoji: '🎉', type: 'FirstCommit', description: '项目初始化' },
    { emoji: '🌍', type: 'I18n', description: '国际化相关' },
    { emoji: '🐎', type: 'Improve', description: '性能优化' },
    { emoji: '🔖', type: 'Release', description: '版本发布' },
    { emoji: '🗑️', type: 'Trash', description: '删除文件或代码' },
    { emoji: '✏️', type: 'Typo', description: '修正拼写错误' },
    { emoji: '💄', type: 'UI', description: 'UI和样式更新' },
    { emoji: '📦', type: 'PackageUpdate', description: '包管理更新' },
    { emoji: '🧪', type: 'Test', description: '测试相关' }
];

export interface LanguageConfig {
    id: string;
    name: string;
    description: string;
    language: string;  // 输出语言：'中文' 或 'English'
}

// 统一的提示词模板
export const PROMPT_TEMPLATE = `请根据以下Git变更信息，生成一个简洁、清晰的commit message。

要求：
1. 使用{language}描述
2. 不超过80个字符
3. 必须采用以下固定格式之一：emoji + 空格 + 英文类型 + 冒号 + 空格 + {language}描述
{types}
4. 选择最符合变更内容的类型
5. {language}描述要具体且有意义，参考示例但不要直接使用
6. 只返回commit message本身，不要其他内容

Git变更信息：
{diff}

Commit Message:`;

export const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
    zh: {
        id: 'git_ai_commit_push_cn',
        name: 'AI智能Git提交(中文)',
        description: '🤖 使用AI智能生成中文commit message并推送到{branch}分支',
        language: '中文'
    },
    en: {
        id: 'git_ai_commit_push_en',
        name: 'AI智能Git提交(英文)',
        description: '🤖 使用AI智能生成英文commit message并推送到{branch}分支',
        language: 'English'
    }
}; 