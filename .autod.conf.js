module.exports = {
  write: true,
  prefix: '~',
  devprefix: '^',
  dep: [
  ],
  devdep: [
    '@types/node',
    '@typescript-eslint/eslint-plugin',
    '@typescript-eslint/parser',
    'coveralls',
    'eslint',
    'eslint-config-ali',
    'eslint-config-egg',
    'expect.js',
    'mocha',
    'nyc',
    'typescript',
  ],
  semver: [
    'koa-router@4',
    'koa-compose@2'
  ],
};
