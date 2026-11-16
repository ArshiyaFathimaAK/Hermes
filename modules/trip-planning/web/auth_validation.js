// auth_validation.js
// Marisa: UC-01 Create Account, UC-02 Log In. AI-assisted draft.
// Purpose: input checks that run before anything is sent to Supabase.
// Each function returns an error message, or "" if the input is valid.
// Messages match my test cases (TC-CA-04, TC-CA-05, TC-CA-06, TC-LI-04).

function validateEmail(email) {
  if (!email) return "This field is required.";
  const looksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return looksValid ? "" : "Please enter a valid email address.";
}

function validatePassword(password) {
  if (!password) return "This field is required.";
  const strongEnough =
    password.length >= 8 &&
    /\d/.test(password) &&          // at least one number
    /[^A-Za-z0-9]/.test(password);  // at least one symbol
  return strongEnough
    ? ""
    : "Password must be at least 8 characters and include a number and a symbol.";
}

function validateLogin(email, password) {
  if (!email || !password) return "Email and password are required.";
  return "";
}

// Lets the tests (Node) and the web page both use these functions.
if (typeof module !== "undefined") {
  module.exports = { validateEmail, validatePassword, validateLogin };
}