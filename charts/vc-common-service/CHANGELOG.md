# Changelog

All notable changes to the `vc-common-service` Helm chart are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this chart adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - Unreleased

### Added

- Initial Helm chart for deploying vc-common-service to BC Gov OpenShift.
- API Deployment with templated resources and probes on `/health/live`
  (liveness) and `/health/ready` (readiness).
- Database migrations as an init container in the API pod (gated by
  `migrations.enabled`).
- Worker Deployment sharing the same image with entrypoint `node dist/worker.js`
  and an independent HPA (gated by `worker.enabled`).
- Service and OpenShift Route (default) with an optional Kubernetes Ingress.
- ConfigMap for non-secret configuration and a Secret that references a
  pre-provisioned Secret by default, with optional in-chart generation.
- NetworkPolicies: router ingress to the API, explicit egress to PostgreSQL and
  Keycloak, plus a DNS-allow policy; each with `extra{Ingress,Egress}` hooks.
- Independent HPAs for the API and Worker.
- `commonLabels` / `commonAnnotations` passthrough and explicit `namespace` on
  all namespaced resources.
- Per-environment values files (`values-dev.yaml`, `values-test.yaml`,
  `values-prod.yaml`) and `ci/ci-values.yaml`.
- Generated `README.md` (via helm-docs).
