import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import vueParser from "vue-eslint-parser";

export default [
  {
    files: ["src/**/*.{ts,vue}"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: [".vue"],
        sourceType: "module"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
];
