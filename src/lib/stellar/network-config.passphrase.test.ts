import { Networks } from "@stellar/stellar-sdk";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getStellarNetworkPassphrase, validateStellarNetworkPassphrase } from "@/lib/stellar/network-config";

const PASSPHRASE_KEY = "STELLAR_NETWORK_PASSPHRASE";

function saveEnv() {
  return process.env[PASSPHRASE_KEY];
}

function restoreEnv(snapshot: string | undefined) {
  if (snapshot === undefined) {
    delete process.env[PASSPHRASE_KEY];
  } else {
    process.env[PASSPHRASE_KEY] = snapshot;
  }
}

describe("validateStellarNetworkPassphrase", () => {
  it("accepts the Stellar testnet passphrase", () => {
    expect(() => validateStellarNetworkPassphrase(Networks.TESTNET)).not.toThrow();
  });

  it("accepts the Stellar public network passphrase", () => {
    expect(() => validateStellarNetworkPassphrase(Networks.PUBLIC)).not.toThrow();
  });

  it("rejects an empty passphrase", () => {
    expect(() => validateStellarNetworkPassphrase("")).toThrow(PASSPHRASE_KEY);
  });

  it("rejects a whitespace-padded passphrase", () => {
    expect(() => validateStellarNetworkPassphrase(` ${Networks.TESTNET} `)).toThrow(
      PASSPHRASE_KEY,
    );
  });

  it("rejects a passphrase containing control characters", () => {
    expect(() => validateStellarNetworkPassphrase(`a\u0001b`)).toThrow(PASSPHRASE_KEY);
    expect(() => validateStellarNetworkPassphrase(`a\u007fb`)).toThrow(PASSPHRASE_KEY);
  });

  it("rejects an oversized passphrase", () => {
    const oversized = "a".repeat(257);
    expect(() => validateStellarNetworkPassphrase(oversized)).toThrow(PASSPHRASE_KEY);
  });

  it("accepts a passphrase exactly at the maximum length", () => {
    const maxLength = "a".repeat(256);
    expect(() => validateStellarNetworkPassphrase(maxLength)).not.toThrow();
  });

  it("names only the configuration key and never leaks the passphrase value", () => {
    try {
      validateStellarNetworkPassphrase(" secret-value ");
      throw new Error("expected validation to throw");
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain(PASSPHRASE_KEY);
      expect(message).not.toContain("secret-value");
    }
  });
});

describe("getStellarNetworkPassphrase", () => {
  let snapshot: string | undefined;

  beforeEach(() => {
    snapshot = saveEnv();
  });

  afterEach(() => {
    restoreEnv(snapshot);
  });

  it("returns the testnet default when the passphrase is not configured", () => {
    delete process.env[PASSPHRASE_KEY];
    expect(getStellarNetworkPassphrase()).toBe(Networks.TESTNET);
  });

  it("returns the configured passphrase when valid", () => {
    process.env[PASSPHRASE_KEY] = Networks.PUBLIC;
    expect(getStellarNetworkPassphrase()).toBe(Networks.PUBLIC);
  });

  it("throws when the configured passphrase is empty", () => {
    process.env[PASSPHRASE_KEY] = "";
    expect(() => getStellarNetworkPassphrase()).toThrow(PASSPHRASE_KEY);
  });

  it("throws when the configured passphrase is padded", () => {
    process.env[PASSPHRASE_KEY] = ` ${Networks.TESTNET} `;
    expect(() => getStellarNetworkPassphrase()).toThrow(PASSPHRASE_KEY);
  });
});
