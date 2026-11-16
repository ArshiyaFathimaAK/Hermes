// Marisa: unit tests for auth_validation.js (UC-01 Create Account, UC-02 Log In).
// Test IDs match my test case document. AI-assisted draft.

const test = require("node:test");
const assert = require("node:assert");
const { validateEmail, validatePassword, validateLogin } = require("../web/auth_validation.js");

test("TC-CA-01 valid email and password produce no errors", () => {
  assert.strictEqual(validateEmail("sam.test01@example.com"), "");
  assert.strictEqual(validatePassword("Hermes#2026!"), "");
});

test("TC-CA-04 invalid email format is rejected", () => {
  assert.strictEqual(validateEmail("sam.test@"), "Please enter a valid email address.");
});

test("TC-CA-05 weak password is rejected", () => {
  assert.strictEqual(
    validatePassword("abc123"),
    "Password must be at least 8 characters and include a number and a symbol."
  );
});

test("TC-CA-06 empty fields show required message", () => {
  assert.strictEqual(validateEmail(""), "This field is required.");
  assert.strictEqual(validatePassword(""), "This field is required.");
});

test("TC-LI-04 login with empty fields is rejected", () => {
  assert.strictEqual(validateLogin("", ""), "Email and password are required.");
});