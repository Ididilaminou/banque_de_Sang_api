const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const env = require("../src/config/envConfig");

describe("Configuration de l'application", () => {
  it("accepte la configuration locale actuelle", () => {
    assert.doesNotThrow(() => env.validerConfiguration({ stricte: false }));
  });

  it("refuse un secret JWT de production trop faible", () => {
    const original = env.jwtSecret;
    env.jwtSecret = "secret-court";

    try {
      assert.throws(
        () => env.validerConfiguration({ stricte: true }),
        /JWT_SECRET/,
      );
    } finally {
      env.jwtSecret = original;
    }
  });
});
