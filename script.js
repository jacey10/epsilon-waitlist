/*
 * Waitlist submission
 * This page submits to Supabase through its REST API, so it works with a static HTML site.
 * 1. Create the `waitlist` table and insert-only policy in Supabase (SQL editor).
 * 2. Replace SUPABASE_URL and SUPABASE_ANON_KEY below with your project values.
 * Use the anon / publishable key only. Never put the service_role / secret key here.
 * Until configured, the form shows a clear setup error and does NOT pretend
 * that a visitor was added to the waitlist.
 */
const SUPABASE_URL = "https://gzmgstghytrscbynrrhq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_YBZhO25KT-Mm_QhxTRACTA_asVJ1-ED";

const form = document.querySelector("#waitlist-form");
const emailInput = document.querySelector("#email");
const errorMessage = document.querySelector("#form-error");
const submitButton = document.querySelector("#submit-button");
const successPanel = document.querySelector("#success-panel");

function setError(message) {
  errorMessage.textContent = message;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setError("");

  if (!emailInput.checkValidity()) {
    setError("Enter a valid email address to join the waitlist.");
    emailInput.focus();
    return;
  }

  if (SUPABASE_URL.includes("REPLACE_WITH") || SUPABASE_ANON_KEY.includes("REPLACE_WITH")) {
    setError("The waitlist form hasn’t been connected yet. Please try again later.");
    return;
  }

  const originalButtonContent = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = "<span>Submitting…</span><span aria-hidden=\"true\">…</span>";

  // Empty answers are sent as null so skipped questions stay clean in the table.
  const data = new FormData(form);
  const goals = data.getAll("goals");
  const payload = {
    email: emailInput.value.trim().toLowerCase(),
    biggest_challenge: data.get("biggest_challenge") || null,
    current_method: data.get("current_method") || null,
    goals: goals.length ? goals : null,
    early_access: data.get("early_access") === "yes"
  };

  // Legacy anon keys are JWTs and also go in Authorization; new publishable keys use apikey only.
  const headers = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_ANON_KEY,
    // Without this, Supabase tries to read the new row back and the insert-only policy blocks it.
    "Prefer": "return=minimal"
  };
  if (SUPABASE_ANON_KEY.startsWith("eyJ")) {
    headers["Authorization"] = `Bearer ${SUPABASE_ANON_KEY}`;
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      // 23505 = unique violation: this email is already on the list, so treat it as success.
      if (result?.code !== "23505") {
        throw new Error(
          response.status === 429
            ? "Too many attempts. Please wait a moment and try again."
            : "We couldn’t submit your details. Please try again."
        );
      }
    }

    form.hidden = true;
    successPanel.hidden = false;
    successPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (error) {
    // fetch throws a TypeError when the request never reaches the server (offline, blocked, etc.)
    setError(
      error instanceof TypeError
        ? "We couldn’t reach the server. Check your connection and try again."
        : error.message || "Something went wrong. Please try again in a moment."
    );
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonContent;
  }
});

emailInput.addEventListener("input", () => setError(""));
