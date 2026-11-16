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

// Extra edge-case tests (Marisa). Same functions, same expected messages.

test("TC-CA-05a password without a number is rejected", () => {
  assert.strictEqual(
    validatePassword("Hermes#Pass"),
    "Password must be at least 8 characters and include a number and a symbol."
  );
});

test("TC-CA-05b password without a symbol is rejected", () => {
  assert.strictEqual(
    validatePassword("Hermes2026"),
    "Password must be at least 8 characters and include a number and a symbol."
  );
});

test("TC-CA-05c password shorter than 8 characters is rejected", () => {
  assert.strictEqual(
    validatePassword("Ab1#"),
    "Password must be at least 8 characters and include a number and a symbol."
  );
});

test("TC-CA-05d password of exactly 8 characters is accepted", () => {
  assert.strictEqual(validatePassword("Abcd12#e"), "");
});

test("TC-CA-04a email containing a space is rejected", () => {
  assert.strictEqual(
    validateEmail("sam test@example.com"),
    "Please enter a valid email address."
  );
});

test("TC-CA-04b email missing a domain extension is rejected", () => {
  assert.strictEqual(
    validateEmail("sam@example"),
    "Please enter a valid email address."
  );
});

test("TC-LI-01a valid login input produces no error", () => {
  assert.strictEqual(validateLogin("sam.test01@example.com", "Hermes#2026!"), "");
});

test("TC-LI-04a login with only an email is rejected", () => {
  assert.strictEqual(
    validateLogin("sam.test01@example.com", ""),
    "Email and password are required."
  );
});

test("TC-LI-04b login with only a password is rejected", () => {
  assert.strictEqual(
    validateLogin("", "Hermes#2026!"),
    "Email and password are required."
  );
});