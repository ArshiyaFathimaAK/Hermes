// Marisa: Recover Password and Log Out. AI-assisted draft.
// Purpose: talks to Supabase Auth. Uses the validators in auth_validation.js.

const SUPABASE_URL = "https://zlcclaqiilsakslcqjqs.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "sb_publishable_YOMBdM1WUiyD--mL6hnuGw_B0BGjAzo";

const keysMissing =
  SUPABASE_URL.startsWith("PASTE") || SUPABASE_ANON_KEY.startsWith("PASTE");
const supabaseClient = keysMissing
  ? null
  : window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// MP-TC03: send a password reset email
async function requestPasswordReset(email) {
  if (!supabaseClient) return { ok: false, message: "Supabase is not configured yet." };
  const problem = validateEmail(email);
  if (problem) return { ok: false, message: problem };
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/reset.html",
  });
  if (error) return { ok: false, message: "Unable to send reset link. Please try again later." };
  return { ok: true, message: "Password reset link sent to your email." };
}

// MP-TC03: set the new password (used on reset.html after the email link)
async function updatePassword(newPassword) {
  if (!supabaseClient) return { ok: false, message: "Supabase is not configured yet." };
  const problem = validatePassword(newPassword);
  if (problem) return { ok: false, message: problem };
  const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, message: "Unable to update password. Request a new reset link." };
  return { ok: true, message: "Your password has been updated." };
}

// MP-TC04: end the session
async function logOut() {
  if (!supabaseClient) return { ok: false, message: "Supabase is not configured yet." };
  const { error } = await supabaseClient.auth.signOut();
  if (error) return { ok: false, message: "Unable to log out. Please try again." };
  return { ok: true, message: "You have been logged out." };
}

// Used by logged-in pages: is anyone logged in?
async function isLoggedIn() {
  if (!supabaseClient) return false;
  const { data } = await supabaseClient.auth.getSession();
  return !!data.session;
}