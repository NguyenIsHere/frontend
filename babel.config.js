module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel'
    ], plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@': '.',
            '@app': './app',
            '@components': './components',
            '@api': './api',
            '@context': './context'
          },
          extensions: ['.js', '.jsx', '.ts', '.tsx']
        },
      ],
    ],
  }
}
