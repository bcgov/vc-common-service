# CD Workflow Design — Build, Publish Image & Helm Chart (Phase 1)

- **Date:** 2026-07-16
- **Ticket:** [IN-07] CD pipeline (deploy to dev) — bcgov/vc-common-service#19
- **Related:** Helm chart PR #113 (`feat/helm-chart-openshift`, not yet merged), CI PR #107 (merged)
- **Reference:** bcgov/traction CD workflows (`on_push_main.yaml`, `chart_release.yaml`, `.github/actions/build_ui`)
- **Status:** Approved design, pre-implementation

## 1. Purpose & scope

Implement continuous delivery for `vc-common-service`: on merge to `main`, build a
multi-arch container image and publish it to GitHub Container Registry (GHCR), package
and publish the Helm chart as an OCI artifact to GHCR, and notify the team via a
Microsoft Teams webhook. This prepares the service for OpenShift deployment without yet
performing the cluster deploy.

### In scope (Phase 1)

- Multi-arch image build & publish to GHCR (`linux/amd64`, `linux/arm64`).
- Helm chart package & publish as an OCI artifact to GHCR.
- Microsoft Teams notifications for publish outcomes (success and failure).
- Reusable CI checks (lint/build/test) gating all publishing.
- Build-layer caching, SBOM, and provenance attestation.

### Out of scope (Phase 2 — separately tracked)

- `oc-login` + `helm upgrade` deploy to the dev environment.
- ArgoCD wiring for test and prod.
- OpenShift sealed secrets management.
- Automatic rollback on failed health checks.

Phase 2 is deferred because the Helm chart is still in PR (#113), OpenShift cluster
access/service-account credentials and sealed secrets are not yet provisioned, and the
chart's `worker`/`migrations` paths are disabled until the app ships `dist/worker.js` and
a migration-runner command.

## 2. Key decisions (from brainstorming)

| Decision | Choice | Rationale |
|---|---|---|
| CD reach now | Build + publish only (prep) | Chart unmerged; no cluster access/sealed secrets yet. |
| Chart registry | GHCR OCI (`oci://ghcr.io/bcgov`) | Helm 3.8+ standard; same registry/auth as image; no `gh-pages` branch to maintain; ArgoCD supports OCI. |
| Notification target | MS Teams via Power Automate **Workflows** webhook (Adaptive Card) | Team uses Teams; O365 connector webhooks (`MessageCard`) are being retired by Microsoft. |
| Trigger + versioning | Merge to `main` → immutable `sha-<short>` + moving `main`; `v*` tag → semver + `latest` | Fits "deploy dev on merge" while keeping human-friendly releases. |
| CI/CD relationship | Extract CI into a **reusable workflow**; CD calls it, then publishes | Single source of truth for quality gates; image is provably the tested commit; avoids `workflow_run` fragility. |
| Platforms | `linux/amd64,linux/arm64` (no Windows) | Service is Node/Alpine on OpenShift (Linux-only); Windows containers can't run there and double build time. Matches traction. |

## 3. Architecture

### File layout

```
.github/
  workflows/
    ci.yml            # PR + push to main: calls ci-checks.yml (reusable)
    ci-checks.yml     # reusable (workflow_call): lint, build, test — extracted from current ci.yml
    cd.yml            # push main + tag v*: calls ci-checks.yml, then publish + notify
  actions/
    build-image/      # composite: buildx multi-arch build+push to GHCR, cache, SBOM/provenance
    publish-chart/    # composite: helm package + push OCI to GHCR, versioned
    notify-teams/     # composite: POST Adaptive Card to Teams Workflows webhook
docs/
  cicd.md             # human docs: triggers, tags, versioning, secrets, Phase 2 notes
```

### Why a reusable workflow for CI checks (not a composite action)

The `test` job depends on a job-level `services: postgres:` container with health checks,
and `lint`/`build`/`test` run as three parallel jobs. Composite actions are step bundles
inside a single job on a single runner — they cannot declare `services:`, `runs-on`,
`strategy`, or per-job `if`. Therefore CI checks must be a reusable workflow. The leaf
build/publish logic (linear steps within one job) is where composite actions fit, so
`build-image`/`publish-chart`/`notify-teams` are composites.

### `cd.yml` job graph

```
ci-checks (reusable: lint + build + test in parallel)
        │  (success)
        ▼
   publish-image ──┐
                   ├──►  notify-teams   (if: always(), reports aggregate outcome)
   publish-chart ──┘
```

- `publish-chart` runs `needs: [publish-image]` — the chart's `appVersion` references the
  published image tag.
- `notify-teams` runs `if: always()` and derives status from `needs.*.result`.
- Nothing publishes unless `ci-checks` succeeds.

### Triggers

| Event | `ci-checks` | `publish-image` | `publish-chart` | `notify-teams` |
|---|---|---|---|---|
| `pull_request` (via `ci.yml`) | ✅ | — | — | — |
| `push` to `main` | ✅ | ✅ | ✅ | ✅ |
| `push` tag `v*` | ✅ | ✅ (semver + latest) | ✅ (semver) | ✅ |

`cd.yml` uses a `concurrency` group keyed on the ref so rapid merges don't race the
moving `main` tag. Publish jobs are guarded by `if: github.repository_owner == 'bcgov'`.

## 4. Component: `build-image` composite action

**Purpose:** build and push the multi-arch container image to GHCR.
**Inputs:** `image_name`, `registry` (default `ghcr.io`), `registry_username`,
`registry_password`, optional `context`/`dockerfile`.
**Outputs:** `image_ref` (digest-pinned `name@sha256:…`), `image_version`, `tags`.

**Steps:**
1. `docker/setup-qemu-action` (emulation for arm64).
2. `docker/setup-buildx-action`.
3. `docker/login-action` → `ghcr.io` with `GITHUB_TOKEN`.
4. `docker/metadata-action` tag rules:
   - `type=sha,prefix=sha-` (immutable per-commit)
   - `type=raw,value=main,enable={{is_default_branch}}` (moving)
   - `type=semver,pattern={{version}}` / `{{major}}.{{minor}}` (tags)
   - `type=raw,value=latest,enable=<is a v* tag>`
5. `docker/build-push-action`:
   - `platforms: linux/amd64,linux/arm64`
   - `cache-from: type=gha` / `cache-to: type=gha,mode=max`
   - `provenance: mode=min`, `sbom: true`
   - `push: true`

All third-party actions pinned to full commit SHA with a version comment, using current
releases (traction's pins are ~a year stale).

## 5. Component: `publish-chart` composite action

**Purpose:** package the Helm chart and publish it as an OCI artifact to GHCR.
**Preconditions:** `charts/vc-common-service/Chart.yaml` exists. If `charts/` is absent
(chart PR not yet merged), the caller job is skipped so `cd.yml` stays green — see §7.

**Steps:**
1. `azure/setup-helm` (pinned).
2. Read base `version`/`appVersion` from `Chart.yaml`; derive published values:
   - push `main` → chart `version = <base>-main.<short-sha>`, `appVersion = sha-<short-sha>`
   - tag `v1.2.3` → chart `version = 1.2.3`, `appVersion = 1.2.3`
   (applied via `helm package --version/--app-version`, leaving `Chart.yaml` untouched in git).
3. **Gate:** `helm lint` + `helm template` against default values and `ci/ci-values.yaml`.
   Fail the job before any push if either fails.
4. `helm dependency build`.
5. `helm package`.
6. `helm registry login ghcr.io` (with `GITHUB_TOKEN`) → `helm push <pkg>.tgz oci://ghcr.io/bcgov`.
   Chart lands at `ghcr.io/bcgov/vc-common-service` alongside the image.

## 6. Component: `notify-teams` composite action

**Purpose:** post a build/publish result to Microsoft Teams.
**Inputs:** `webhook_url` (from secret `TEAMS_WEBHOOK_URL`), `status`, `image_ref`,
`chart_version`, and context (repo, ref, sha, actor, run URL).

**Behavior:**
- Posts an **Adaptive Card** to a Teams **Workflows** (Power Automate) incoming webhook.
- Card shows: status (✅/❌), repo, git ref + short sha, image ref
  (`ghcr.io/bcgov/vc-common-service@sha256:…`), chart version, actor, and a link to the run.
- Themed by outcome (green success / red failure).
- Called with `if: always()`; computes aggregate status from `needs.*.result`.
- **Graceful skip:** if `webhook_url` is empty (e.g. forks, secret unset), log and exit 0 —
  a missing notification secret never fails the run.

> Note: Microsoft is retiring Office 365 connector webhooks (`MessageCard`). This action
> targets the replacement Power Automate Workflows webhook, which accepts Adaptive Card
> JSON. The URL is stored as a repo secret so it can be rotated without code changes.

## 7. Security, permissions & robustness

- `cd.yml` top-level `permissions`: `contents: read`, `packages: write`,
  `id-token: write`, `attestations: write` (minimal; enables provenance/attestations).
- All third-party actions pinned to full commit SHA + version comment (BC Gov supply-chain norm).
- `if: github.repository_owner == 'bcgov'` on publish jobs so forks don't push to the org registry.
- `concurrency` group per ref to serialize the moving `main` tag.
- **Chart-absent guard:** `publish-chart` job condition checks for `charts/vc-common-service/Chart.yaml`
  (e.g. a `dorny/paths-filter` or a lightweight `hashFiles()`/preflight step); when absent the
  job is skipped, not failed. This lets `cd.yml` merge to `main` *before* PR #113 without
  breaking builds.
- No new application secrets beyond `TEAMS_WEBHOOK_URL`; `GITHUB_TOKEN` authenticates GHCR
  for both image and chart.

## 8. Testing strategy

CI/CD is verified per-piece; "testable" here means each artifact and behavior is independently checkable.

**Static / local**
- `actionlint` step added to lint (workflow syntax + expression checks).
- `yamllint` (chart PR introduces `.yamllint`).
- Local `docker buildx build --platform linux/amd64,linux/arm64` proves the multi-arch build.
- `helm lint` + `helm template` locally for the chart.
- Optional: `act` for the workflow graph where feasible.

**Live smoke (run on a branch or fork first)**
- Trigger `cd.yml`; then assert:
  - `docker buildx imagetools inspect ghcr.io/bcgov/vc-common-service:sha-<x>` lists **both**
    `linux/amd64` and `linux/arm64`.
  - `helm pull oci://ghcr.io/bcgov/vc-common-service --version <derived>` succeeds.
  - A Teams card arrives for a forced **success** and a forced **failure**.
  - Second run shows a GHA cache hit (build time drops).

## 9. Completion criteria (Definition of Done)

- [ ] `ci-checks.yml` reusable workflow extracted; `ci.yml` calls it; PR checks behave identically to today.
- [ ] `cd.yml` runs `ci-checks` → publish → notify on push to `main`; publishes only on `ci-checks` success.
- [ ] Multi-arch image (`linux/amd64` + `linux/arm64`) published to `ghcr.io/bcgov/vc-common-service`,
      tagged `sha-<short>` + `main`; a `v*` tag additionally publishes semver + `latest`.
- [ ] SBOM + provenance attestation attached to the published image.
- [ ] GHA layer cache demonstrably hit on a second run (build time drops).
- [ ] Helm chart published as an OCI artifact to `ghcr.io/bcgov` with the derived version;
      `helm pull oci://…` succeeds. Chart lint/template gate blocks a broken chart from publishing.
- [ ] Teams Adaptive Card delivered on success **and** failure; missing `TEAMS_WEBHOOK_URL` skips gracefully.
- [ ] All third-party actions SHA-pinned; `actionlint` passes; `cd.yml` `permissions` are minimal.
- [ ] `cd.yml` no-ops safely when `charts/` is absent (can merge before PR #113).
- [ ] `docs/cicd.md` documents triggers, tags, versioning, required secrets, and the deferred Phase 2.

## 10. Open questions / follow-ups

- Confirm the exact `TEAMS_WEBHOOK_URL` (Workflows webhook) and desired channel before the live smoke test.
- Confirm GHCR package visibility (public vs internal) and org package-creation permissions for
  first push of both image and chart.
- Phase 2 (deploy) will need: OpenShift server URL, a deploy service-account token, target
  namespace(s), and a sealed-secrets workflow — to be gathered when that work is scheduled.
