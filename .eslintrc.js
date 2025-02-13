module.exports = {
  root: true,
  env: {
    es6: true,
    node: true
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    tsconfigRootDir: __dirname,
    sourceType: "module"
  },
  ignorePatterns: [
    "/lib/**/*",
    "src/scripts" // Ignore built files.
  ],
  plugins: ["@typescript-eslint", "import", "prettier"],
  rules: {
    quotes: ["error", "double"],
    indent: "off",

    "import/no-unresolved": 0,
    "require-jsdoc": 0,
    "guard-for-in": 0,
    "prettier/prettier": [
      "error",
      { singleQuote: false, trailingComma: "none", tabWidth: 2 }
    ]
  }
};
