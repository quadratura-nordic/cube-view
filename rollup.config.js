import vue from 'rollup-plugin-vue'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'

export default [
  {
    input: 'src/index.js',
    output: [
      {
        format: 'esm',
        file: 'dist/cube-view.mjs'
      },
      {
        format: 'cjs',
        file: 'dist/cube-view.js'
      }
    ],
    plugins: [
      vue(), peerDepsExternal()
    ]
  }
]