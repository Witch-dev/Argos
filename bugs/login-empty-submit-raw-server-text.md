# Logging in with empty fields shows the server's raw English validation text

**Priority:** P2 · **Size:** S · **Area:** Frontend + backend, login · **Found:** 2026-11-22 (browser check of `specs/modern-web-platform.md` Phase 4) · **Status:** Open

## What happens

On `/login`, pressing "Log in" with both fields empty shows this alert:

> The Password field is required. The EmailOrUsername field is required.

That's ASP.NET's own model-validation message: in English whatever the site's language, and it uses the property name `EmailOrUsername`. Every other error on the page comes from a translated `errors.codes` key.

## Why

The form has `noValidate`, so the browser doesn't stop the submit, and the page sends the empty request. The API's `[Required]` attributes reject it before the controller runs, and the client shows the ProblemDetails text as it comes back. Phase 4 didn't cause this (it only added the red edge on both fields after the submit).

## Suggested fix

Either check for empty fields on the client before sending (a translated "Enter your email or username" / "Enter your password" under each field, with `aria-invalid`), or map the model-validation response to an error code. The client check is smaller and also saves a request. Look at the other `noValidate` auth forms (register, forgot/reset password, request invite) for the same thing.
