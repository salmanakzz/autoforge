const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
    testEnvironment: "node",
    transform: {
        ...tsJestTransformCfg,
    },
    roots: ["<rootDir>/src"], // ✅ Ensures only source files are tested
    testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
};
