// Import Node.js Dependencies
import { describe, it, after } from "node:test";
import assert from "node:assert";

// Import Internal Dependencies
import {
  metadata,
  packument,
  packumentVersion,
  downloads
} from "../src/index.js";
import * as utils from "../src/utils.js";
import { kHttpClientHeaders, setupHttpAgentMock } from "./httpie-mock.js";

// CONSTANTS
const kDefaultPackageVersion = "1.0.0";
const kDefaultPackageName = "@nodesecure/npm-registry-sdk";
const kFakePackageName = (Math.random() * 10).toString();

describe("downloads", () => {
  const apiUrl = utils.getNpmApi().href.slice(0, -1);
  const [dispatcher, close] = setupHttpAgentMock(apiUrl);

  after(() => {
    close();
  });

  it("should throw error if pkg is not defined", async() => {
    const undefinedPkg = undefined;

    assert.rejects(
      async() => await downloads(undefinedPkg as any),
      { name: "TypeError", message: "Argument `pkgName` must be a non empty string" }
    );
  });

  it("should throw error if pkg is not a string", async() => {
    const wrongTypedPkg = 32;

    assert.rejects(
      async() => await downloads(wrongTypedPkg as any),
      { name: "TypeError", message: "Argument `pkgName` must be a non empty string" }
    );
  });

  it("should throw error if pkg is an empty string", async() => {
    const emptyStringPkg = "";

    assert.rejects(
      async() => await downloads(emptyStringPkg),
      { name: "TypeError", message: "Argument `pkgName` must be a non empty string" }
    );
  });

  it("should return the 'last-week' period by default", async() => {
    const pkg = "rimraf";
    const payload = { downloads: 1 };

    dispatcher
      .intercept({
        path: `/downloads/point/last-week/${pkg}`
      })
      .reply(200, payload, kHttpClientHeaders);

    const response = await downloads(pkg);

    assert.deepEqual(response, payload);
  });

  it("should return period provided as function argument", async() => {
    const pkg = "rimraf";
    const period = "last-day";
    const payload = { downloads: 1 };

    dispatcher
      .intercept({ path: `/downloads/point/${period}/${pkg}` })
      .reply(200, payload, kHttpClientHeaders);

    const response = await downloads(pkg, period);

    assert.deepEqual(response, payload);
  });
});

describe("metadata", () => {
  it("should return metadata for the npm registry", async() => {
    const { db_name: dbName } = await metadata();

    assert.equal(dbName, "registry");
  });
});

describe("packument", () => {
  it("should return packument data about the provided registry", async() => {
    const { name } = await packument(kDefaultPackageName);

    assert.equal(name, kDefaultPackageName);
  });

  it("should throw if the package dosn't exist", async() => {
    assert.rejects(
      async() => await packument(kFakePackageName),
      { statusMessage: "Not Found" }
    );
  });
});

describe("packumentVersion", () => {
  it("should return packument data for provided version", async() => {
    const { version } = await packumentVersion(kDefaultPackageName, kDefaultPackageVersion);

    assert.equal(version, kDefaultPackageVersion);
  });

  it("should throw if the package dosn't exist", async() => {
    assert.rejects(
      async() => await packumentVersion(kFakePackageName, kDefaultPackageVersion),
      { statusMessage: "Not Found" }
    );
  });

  it("should throw if provided package version dosn't exist", async() => {
    const fakePackageVersion = "0.0.0";

    assert.rejects(
      async() => await packumentVersion(kDefaultPackageName, fakePackageVersion),
      { data: `version not found: ${fakePackageVersion}` }
    );
  });
});

