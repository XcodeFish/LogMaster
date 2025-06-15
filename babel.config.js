module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
  plugins: ['@babel/plugin-transform-modules-commonjs'],
  env: {
    test: {
      // Jest需要CommonJS模块
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current',
            },
            modules: 'commonjs',
          },
        ],
      ],
    },
    production: {
      // 生产环境保留ES模块
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current',
            },
            modules: false, // 不转换ES模块语法
          },
        ],
      ],
      plugins: [],
    },
  },
};
