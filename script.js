/*
 * Waitlist submission
 * This template uses Formspree because it works with a static HTML site.
 * 1. Create a Formspree form.
 * 2. Replace FORMSPREE_ENDPOINT below with its endpoint URL.
 * Until configured, the form shows a clear setup error and does NOT pretend
 * that a visitor was added to the waitlist.
 */
const FORMSPREE_ENDPOINT = "https://formspree.io/f/REPLACE_WITH_YOUR_FORM_ID";

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

  if (FORMSPREE_ENDPOINT.includes("REPLACE_WITH_YOUR_FORM_ID")) {
    setError("The waitlist form hasn’t been connected yet. Please try again later.");
    return;
  }

  const originalButtonContent = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = "<span>Submitting…</span><span aria-hidden=\"true\">…</span>";

  try {
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      body: new FormData(form),
      headers: { "Accept": "application/json" }
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = result?.errors?.map((item) => item.message).filter(Boolean).join(" ");
      throw new Error(message || "We couldn’t submit your details. Please try again.");
    }

    form.hidden = true;
    successPanel.hidden = false;
    successPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (error) {
    setError(error.message || "Something went wrong. Please try again in a moment.");
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonContent;
  }
});

emailInput.addEventListener("input", () => setError(""));
