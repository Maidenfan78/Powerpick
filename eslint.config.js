// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const pluginReactNative = require("eslint-plugin-react-native");

module.exports = defineConfig([
  expoConfig,
  {
    plugins: {
      "react-native": pluginReactNative,
    },
    ignores: ["dist/*"],
  },
]);
