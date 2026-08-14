module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  moduleNameMapper: {
    "^@assessment/shared$": "<rootDir>/../../../packages/shared/src/index.ts"
  },
  transform: {
    "^.+\\.(t|j)s$": ["ts-jest", { tsconfig: "<rootDir>/../tsconfig.spec.json" }]
  },
  testEnvironment: "node"
};
