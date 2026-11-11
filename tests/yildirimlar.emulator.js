"use strict";

// Runs against the Firestore emulator: npm run test:rules
var assert = require("assert");

var HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8085";
var PROJECT = process.env.GCLOUD_PROJECT || "demo-mindset";
var ROOT = "http://" + HOST + "/v1/projects/" + PROJECT + "/databases/(default)/documents";
var ADMIN = "admin@collectivebucket.com";

function token(uid, email, verified) {
  var header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  var payload = Buffer.from(
    JSON.stringify({
      iss: "https://securetoken.google.com/" + PROJECT,
      aud: PROJECT,
      sub: uid,
      user_id: uid,
      email: email,
      email_verified: verified,
      iat: 1,
      exp: 9999999999,
      auth_time: 1,
      firebase: { sign_in_provider: "google.com" }
    })
  ).toString("base64url");
  return header + "." + payload + ".";
}

function note(fields) {
  var base = {
    note: { stringValue: "Gezdim, balkon geniş." },
    stars: { integerValue: "4" },
    updatedAt: { timestampValue: "2026-11-11T00:00:00Z" }
  };
  return { fields: Object.assign(base, fields || {}) };
}

async function call(method, url, who, body) {
  var headers = { "Content-Type": "application/json" };
  if (who) headers.Authorization = "Bearer " + token(who.uid, who.email, who.verified);
  var res = await fetch(url, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined });
  return res.status;
}

(async function () {
  await fetch("http://" + HOST + "/emulator/v1/projects/" + PROJECT + "/databases/(default)/documents", { method: "DELETE" });

  var admin = { uid: "adm", email: ADMIN, verified: true };
  var unverified = { uid: "fake", email: ADMIN, verified: false };
  var other = { uid: "bob", email: "bob@example.com", verified: true };
  var doc = ROOT + "/apps/yildirimlar/daireler/1325633405";

  assert.strictEqual(await call("PATCH", doc, admin, note()), 200, "admin writes a note");
  assert.strictEqual(await call("GET", doc, null), 200, "anyone reads a note");
  assert.strictEqual(await call("GET", ROOT + "/apps/yildirimlar/daireler", null), 200, "anyone lists notes");
  assert.strictEqual(await call("PATCH", doc, other, note()), 403, "other user cannot write");
  assert.strictEqual(await call("PATCH", doc, unverified, note()), 403, "unverified admin email cannot write");
  assert.strictEqual(await call("PATCH", doc, null, note()), 403, "anonymous cannot write");
  assert.strictEqual(await call("PATCH", doc, admin, note({ stars: { integerValue: "6" } })), 403, "stars max 5");
  assert.strictEqual(await call("PATCH", doc, admin, note({ extra: { stringValue: "x" } })), 403, "no extra fields");
  assert.strictEqual(await call("PATCH", doc, admin, note({ note: { stringValue: "x".repeat(4001) } })), 403, "note max 4000");
  assert.strictEqual(await call("PATCH", ROOT + "/apps/yildirimlar/daireler/abc", admin, note()), 403, "listing id is numeric");
  assert.strictEqual(await call("DELETE", doc, admin), 403, "no deletes");
  assert.strictEqual(await call("GET", ROOT + "/apps/yildirimlar/profiles/adm", admin), 403, "rest of yildirimlar stays closed");

  console.log("yildirimlar rules ok");
})().catch(function (error) {
  console.error(error);
  process.exit(1);
});
