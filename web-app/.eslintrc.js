module.exports = {
  extends: ['react-app'],
  ignorePatterns: ['src/wasm/*'],
  rules: {
    'no-undef': 'off',
    'eqeqeq': 'off',
    'no-new-object': 'off',
    'no-array-constructor': 'off'
  }
};
