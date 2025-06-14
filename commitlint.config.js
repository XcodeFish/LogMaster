module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'build', // 构建相关
        'chore', // 构建工具相关
        'ci', // CI相关
        'docs', // 文档
        'feat', // 新功能
        'fix', // Bug修复
        'perf', // 性能相关
        'refactor', // 重构
        'revert', // 版本回滚
        'style', // 格式（不影响代码运行的变动）
        'test' // 测试
      ]
    ],
    'type-case': [2, 'always', 'lower'],
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 72]
  }
};
