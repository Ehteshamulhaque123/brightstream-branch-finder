const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts", "*.test.ts"],
  globals: {
    'ts-jest': {
      tsconfig: 'brightstream-branch-finder/tsconfig.jest.json',
    },
  },
};