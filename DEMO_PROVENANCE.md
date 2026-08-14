# Provenance and modification notice

This repository is a **copy** of [Apache Superset](https://github.com/apache/superset),
taken at upstream commit `de2276225a`, created solely as the target repository
for a technical demonstration of an automated remediation pipeline
("Sentinel").

It is **not** a fork in the GitHub sense and has no upstream relationship. That
is deliberate: it prevents pull requests from accidentally targeting the Apache
project and prevents issue references from propagating there.

## Apache License 2.0 compliance

- The original `LICENSE.txt` and `NOTICE` are retained unmodified.
- Apache Superset is a trademark of the Apache Software Foundation. This copy
  is not affiliated with, endorsed by, or supported by the ASF.
- Per section 4(b) of the licence, the modifications made here are:
  - Git history is squashed to a single commit; upstream history is not retained.
  - `.github/PULL_REQUEST_TEMPLATE/DEVIN_PR_TEMPLATE.md` added, so automated
    pull requests do not reproduce upstream issue links.
  - This file added.
  - Issues filed and pull requests opened in this repository are demonstration
    artefacts produced by the Sentinel pipeline. They are not contributions to
    Apache Superset and must not be submitted upstream.

## Do not report issues here

For genuine Superset bugs, use the upstream project. Nothing in this repository
is monitored or supported.

## Additional modification

- `.github/workflows/` removed. Superset's CI suite requires secrets and
  infrastructure this copy does not have; left in place it would fail noisily on
  every demonstration pull request and consume Actions minutes for no signal. A
  single purpose-built workflow is added instead, so the pipeline's
  CI-failure-feedback path still has a real check to react to.
