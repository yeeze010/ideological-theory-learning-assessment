module.exports = {
  rootDir: "..",
  moduleFileExtensions: ["js", "json", "ts"],
  testRegex: "test/.*\\.e2e-spec\\.ts$",
  moduleNameMapper: {
    "^@assessment/shared$": "<rootDir>/../../packages/shared/src/index.ts"
  },
  transform: {
    "^.+\\.(t|j)s$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.spec.json" }]
  },
  testEnvironment: "node"
};
