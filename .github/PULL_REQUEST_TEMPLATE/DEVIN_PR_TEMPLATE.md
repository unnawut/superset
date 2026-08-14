<!---
Devin-specific PR template. Devin prefers this file over
.github/PULL_REQUEST_TEMPLATE.md.

It mirrors the upstream template but deliberately contains NO links to
github.com/apache/superset. A full upstream URL in a PR body creates a
cross-reference event on the upstream issue, which spams a repository this
fork does not own. Keep it that way: reference upstream issues as plain text
(for example: SIP-59, apache issue 13351) rather than as URLs.

PR title must follow Conventional Commits: type(scope): description
-->

### SUMMARY
<!--- What changed and why. State the root cause, not just the symptom. -->

### VERIFICATION
<!--- Required. Paste the exact verify command from the Sentinel issue
      contract and its real output, including the exit code. -->

```
$ <verify command>
<output>
```

### TESTING INSTRUCTIONS
<!--- How can a reviewer manually confirm this? -->

### ADDITIONAL INFORMATION
<!--- Check any relevant boxes with "x" -->
- [ ] Has associated issue:
- [ ] Required feature flags:
- [ ] Changes UI
- [ ] Includes DB Migration (follow the SIP-59 approval process; do not link it)
  - [ ] Migration is atomic, supports rollback & is backwards-compatible
  - [ ] Confirm DB migration upgrade and downgrade tested
- [ ] Introduces new feature or API
- [ ] Removes existing feature or API
