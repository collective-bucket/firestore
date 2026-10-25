"use strict";

// Runs against the Firestore emulator: npm run test:rules
var assert = require("assert");

var HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8085";
var PROJECT = process.env.GCLOUD_PROJECT || "demo-mindset";
var ROOT = "http://" + HOST + "/v1/projects/" + PROJECT + "/databases/(default)/documents";

function token(uid) {
  var header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  var payload = Buffer.from(
    JSON.stringify({
      iss: "https://securetoken.google.com/" + PROJECT,
      aud: PROJECT,
      sub: uid,
      user_id: uid,
      iat: 1,
      exp: 9999999999,
      auth_time: 1,
      firebase: { sign_in_provider: "password" }
    })
  ).toString("base64url");
  return header + "." + payload + ".";
}

function budget(uid) {
  var now = { stringValue: "2026-10-25T00:00:00.000Z" };
  return {
    fields: {
      ownerUid: { stringValue: uid },
      incomes: { arrayValue: { values: [] } },
      goals: { arrayValue: { values: [] } },
      months: { mapValue: { fields: {} } },
      createdAt: now,
      updatedAt: now
    }
  };
}

async function call(method, url, uid, body) {
  var headers = { "Content-Type": "application/json" };
  if (uid) headers.Authorization = "Bearer " + token(uid);
  var res = await fetch(url, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined });
  return res.status;
}

(async function () {
  await fetch("http://" + HOST + "/emulator/v1/projects/" + PROJECT + "/databases/(default)/documents", { method: "DELETE" });

  assert.strictEqual(await call("POST", ROOT + "/budgets?documentId=ann", "ann", budget("ann")), 200, "owner creates");
  assert.strictEqual(await call("GET", ROOT + "/budgets/ann", "ann"), 200, "owner reads");
  assert.strictEqual(await call("GET", ROOT + "/budgets/ann", "bob"), 403, "stranger cannot read");
  assert.strictEqual(await call("GET", ROOT + "/budgets/ann", null), 403, "anonymous cannot read");
  assert.strictEqual(await call("POST", ROOT + "/budgets?documentId=bob", "ann", budget("bob")), 403, "cannot create for another uid");
  assert.strictEqual(await call("DELETE", ROOT + "/budgets/ann", "bob"), 403, "stranger cannot delete");

  assert.strictEqual(await call("GET", ROOT + "/apps/yildirimlar/profiles/ann", "ann"), 403, "yildirimlar is closed");

  console.log("budget rules ok");
})().catch(function (error) {
  console.error(error);
  process.exit(1);
});
