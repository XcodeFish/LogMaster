import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import filesize from 'rollup-plugin-filesize';
import pkg from './package.json';
import { terser } from 'rollup-plugin-terser';

const banner = `/*!
 * LogMaster v${pkg.version}
 * (c) ${new Date().getFullYear()} LogMaster Contributors
 * Released under the MIT License
 */`;

// 共享配置
const baseConfig = {
  input: 'src/index.js',
  plugins: [
    resolve(),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
    }),
    filesize(),
  ],
};

// 输出配置
export default [
  // ES 模块版本（支持代码分割和动态导入）
  {
    ...baseConfig,
    output: {
      dir: 'dist/esm',
      format: 'es',
      banner,
      entryFileNames: 'logmaster.js',
      chunkFileNames: 'chunks/[name]-[hash].js',
    },
  },
  // CommonJS 版本（支持代码分割）
  {
    ...baseConfig,
    output: {
      dir: 'dist/cjs',
      format: 'cjs',
      exports: 'default',
      banner,
      entryFileNames: 'logmaster.cjs.js',
      chunkFileNames: 'chunks/[name]-[hash].js',
    },
  },
  // 单文件 ES 模块版本（不支持代码分割，但保持向后兼容）
  {
    ...baseConfig,
    input: 'src/index-bundle.js',
    output: {
      file: 'dist/logmaster.esm.js',
      format: 'es',
      banner,
    },
  },
  // 单文件 CommonJS 版本（不支持代码分割，但保持向后兼容）
  {
    ...baseConfig,
    input: 'src/index-bundle.js',
    output: {
      file: 'dist/logmaster.cjs.js',
      format: 'cjs',
      exports: 'default',
      banner,
    },
  },
  // 浏览器可用的 UMD 版本
  {
    input: 'src/browser.js',
    plugins: [
      resolve({
        browser: true,
      }),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
      }),
      terser({
        format: {
          comments: function (node, comment) {
            const text = comment.value;
            const type = comment.type;
            // 保留 banner 注释
            if (type == 'comment2' && /LogMaster/.test(text)) {
              return true;
            }
          },
        },
      }),
      filesize(),
    ],
    output: {
      file: 'dist/logmaster.min.js',
      format: 'umd',
      name: 'LogMaster',
      banner,
      exports: 'named',
      globals: {
        window: 'window',
      },
    },
  },
];
