module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          browsers: ['>0.25%', 'not dead', 'not ie 11'],
          node: '12'
        },
        modules: false,
        loose: true
      }
    ]
  ],
  plugins: [],
  env: {
    test: {
      // Jest需要CommonJS模块
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current'
            },
            modules: 'commonjs'
          }
        ]
      ]
    },
    production: {
      // 生产环境优化
      plugins: []
    }
  }
};
