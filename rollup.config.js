import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import filesize from 'rollup-plugin-filesize';
import pkg from './package.json';

const banner = `/*!
 * LogMaster v${pkg.version}
 * (c) ${new Date().getFullYear()} LogMaster Contributors
 * Released under the MIT License
 */`;

// 环境变量
const BUILD = process.env.BUILD || 'production';
const isProduction = BUILD === 'production';

// 共享配置
const baseConfig = {
  input: 'src/index.js',
  plugins: [
    resolve(),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**'
    }),
    filesize()
  ]
};

// 输出配置
export default [
  // UMD 版本 (未压缩)
  {
    ...baseConfig,
    output: {
      file: 'dist/logmaster.js',
      format: 'umd',
      name: 'LogMaster',
      banner
    }
  },
  // UMD 版本 (压缩)
  {
    ...baseConfig,
    output: {
      file: 'dist/logmaster.min.js',
      format: 'umd',
      name: 'LogMaster',
      banner
    },
    plugins: [
      ...baseConfig.plugins,
      terser({
        output: {
          comments: /^!/
        }
      })
    ]
  },
  // ESM 版本
  {
    ...baseConfig,
    output: {
      file: 'dist/logmaster.esm.js',
      format: 'es',
      banner
    }
  },
  // CommonJS 版本
  {
    ...baseConfig,
    output: {
      file: 'dist/logmaster.cjs.js',
      format: 'cjs',
      exports: 'default',
      banner
    }
  }
];
