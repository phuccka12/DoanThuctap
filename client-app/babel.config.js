module.exports = function(api) {
  api && api.cache && api.cache(true);
  return {
    // `nativewind/babel` provides a preset-style export (it returns an object
    // with a `plugins` array). It must go in `presets`, not `plugins`.
    presets: ['babel-preset-expo', 'nativewind/babel'],
    plugins: [],
  };
};
