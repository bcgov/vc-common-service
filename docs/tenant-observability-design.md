# Spike: Self-Serve Tenant-Scoped Grafana Dashboards

**Issue**: [bcgov/vc-common-service#103](https://github.com/bcgov/vc-common-service/issues/103)
**Status**: Approach decided — Grafana + identity-aware gateway; Traction-only MVP; app-issued tokens
**Started**: 2026-06-30
**Last updated**: 2026-07-23

---

## Overview

This document captures the research and the resulting design decisions for enabling **tenant-scoped observability** — letting a tenant self-serve access to dashboards scoped to only their own data. For the MVP the relevant services are **vc-common-service** (greenfield NestJS service) and **Traction (ACA-Py)**, its sole credential-agent backend.

The requirements that shape the design:

- **Enforcement, not just UX scoping**: a tenant must not be able to circumvent filters to view another tenant's data. Multiple tenants may be active simultaneously, each fully isolated.
- **Scale**: the design must work at **hundreds to thousands of tenants**. Any approach requiring per-tenant Grafana resources (orgs, datasources, dashboard copies) is ruled out — per-tenant cost on the access layer must be near zero.
- **Self-serve**: tenant onboarding must not require operator intervention to make observability available.

A secondary, **platform-internal** goal is request tracing for troubleshooting (see [Tracing & Metrics](#tracing--metrics-platform-internal)). Tenant-facing scope for MVP is **logs, deliberately**.

### Decisions

Three decisions frame everything below and supersede parts of the original research:

1. **Traction-only MVP.** Cross-service correlation across vc-authn-oidc, the Endorser, and the Mediator is **out of scope** for MVP (it needs a dynamic, multi-identifier registry and DIDComm-boundary work). The tenant identity registry collapses to a single static mapping: **`tenant_id → wallet_id`**. Multi-service correlation is captured as post-MVP.
2. **Grafana for tenant-facing views** (identity-aware gateway + shared "Tenants" org + generic dashboards), **chosen over** rendering log views inside vc-common-service. This supersedes the in-app log-query-service + terminal-console path (requirements OB-07 + UI-08).
3. **App-issued tokens, not direct Keycloak.** Grafana authenticates as an **OIDC client of vc-common-service's own `oidc-provider`**, which federates upstream to Keycloak for human login. Grafana forwards the **app-issued** token; the identity-aware gateway validates it against vc-common-service's JWKS — the **same validation as the API's JWT guard (AU-03)** — and reads `tenant_id` from an app-issued claim. This removes all Keycloak group/claim-mapping work.

**TL;DR of the design**:

- Enable native Loki multi-tenancy (`auth_enabled: true`); Alloy routes each log line to a per-tenant Loki tenant via `stage.tenant`, keyed on `wallet_id` (Traction/ACA-Py) or `tenant_id` (vc-common-service). Enforcement is in the storage layer itself.
- Maintain a **tenant identity registry** in vc-common-service: `tenant_id → wallet_id`.
- **Auth flow**: Grafana → vc-common-service `oidc-provider` → Keycloak (upstream). Grafana forwards the app-issued access token; a small **identity-aware gateway** in front of Loki validates it, resolves `tenant_id → wallet_id` from the registry, and sets a pipe-joined `X-Scope-OrgID: tenant_id|wallet_id` — so a tenant sees **both** its vc-common-service and its Traction logs. Zero per-tenant Grafana resources — one org for all tenants, one datasource, one set of generic dashboards.
- Keep **traces and metrics platform-internal**, tagged with `tenant.id` for filtering when assisting tenants.

---

## Current Stack State

Understanding what we're starting from is essential before evaluating options.

| Component | Version | Multi-tenancy mode | Notes |
|-----------|---------|-------------------|-------|
| Grafana | 13.0.1 (chart 12.3.1) | Single org (org 1) | Keycloak SSO via `auth.generic_oauth` |
| Loki | 3.7.2 (chart 17.4.7) | `auth_enabled: false` | Single tenant "fake", no label enforcement |
| Mimir | unknown | Appears single-tenant | Gateway adds `X-Scope-OrgID` but no auth enforced |
| Tempo | unknown | No auth config | Single-tenant mode |
| Alloy | deployed per-namespace | N/A (collector only) | Labels: `namespace`, `pod`, `container`, `app`, `source`, `log_source` |

**Key facts about Grafana today:**

- Single shared instance in `ca7f8f-test`
- All datasources provisioned in org 1 via `values.yaml` (not sidecar)
- Keycloak role mapping: `grafanaadmin → GrafanaAdmin`, `admin → Admin`, `editor → Editor`, `viewer → Viewer`
- No per-tenant orgs, folders, or dashboard restrictions exist
- No `auto_assign_org` configured — new OAuth users land in org 1 by default

> **Target change**: the tenant-facing design replaces Grafana's IdP — instead of authenticating directly against Keycloak, Grafana becomes an OIDC client of **vc-common-service's `oidc-provider`** (which federates upstream to Keycloak). See the Auth Integration section below.

**Key facts about Loki today:**

- `auth_enabled: false` means ALL data lives under tenant ID `"fake"`
- No `tenant_id` or application-level VC tenant label is present in stored streams
- Alloy collects logs tagged only with Kubernetes metadata (namespace, pod, container, app), through a `loki.process` pipeline per namespace ([infra/monitoring/alloy/values.yaml](../infra/monitoring/alloy/values.yaml)) — relevant because tenant routing (below) slots into this existing pipeline
- There is no label today that maps a log line to a VC tenant (tenant_id / wallet_id / agent_id)

**In-flight work relevant to this spike:**

- OpenTelemetry instrumentation is being rolled out across our services — this directly feeds the Tracing & Metrics section

---

## Tenant Identity (MVP: Traction)

> **Context**: `bcgov/vc-common-service` is greenfield — it can be designed from day one to emit a structured `tenant_id` in its logs and to attribute its Traction calls to the right wallet.

For the MVP there are exactly two identifiers to correlate, and the mapping between them is **static and one-to-one**:

| Service | Tenant identifier | In logs via |
|---------|-------------------|-------------|
| **vc-common-service** | `tenant_id` (app-owned) | structured JSON logging (pino, OB-09) |
| **Traction / ACA-Py** | `wallet_id` (sub-wallet UUID) | ACA-Py structured logs; attributed to vc-common-service's calls via `X-Wallet-ID` |

### The registry

When a tenant is onboarded, vc-common-service creates its Traction wallet and therefore knows both identifiers at once. It records one row:

```json
{
  "tenant_id": "tenant-456",
  "traction_wallet_id": "abc-111"
}
```

This registry is the single load-bearing mapping. It is consumed by the **identity-aware gateway** at query time (cached): the gateway receives an app-issued token carrying `tenant_id`, looks up the `wallet_id`, and sets a pipe-joined Loki tenant scope (`X-Scope-OrgID: tenant_id|wallet_id`) covering **both** the vc-common-service stream (ingested under `tenant_id`) and the Traction stream (ingested under `wallet_id`). The gateway never parses or rewrites the query — it only translates identity into a tenant scope that Loki itself enforces. Per-tenant cost: one row.

Because the mapping is one-to-one and static, none of the original research's dynamic-registry, per-tenant Grafana datasource, or query-rewriting-proxy machinery is needed for MVP.

### Getting identifiers into log streams

- **vc-common-service**: log `tenant_id` in structured JSON from day one (OB-09), and send `X-Wallet-ID` on outbound calls to the Traction API so those requests are attributable in Traction's logs too (OB-08).
- **Traction / ACA-Py**: ACA-Py in multi-tenant mode includes `wallet_id` in its structured log output as part of the agent's logging context. Alloy extracts it via `stage.json` or `stage.regex` — no code changes to Traction/ACA-Py required.

### Post-MVP: multi-service correlation

Correlating vc-authn-oidc, the Endorser, and the Mediator is deferred. Those services identify a tenant by `connection_id` / DID and communicate over DIDComm (no HTTP header to propagate), so correlation there needs a **dynamic, multi-identifier registry** and DIDComm-boundary work. When needed, the registry row gains additional columns (`vc_authn_connection_id`, `endorser_did`, …) and the gateway pipe-joins them into `X-Scope-OrgID`. Out of scope for MVP.

### Open questions

- [ ] Does ACA-Py in our Traction deployment log `wallet_id` in structured JSON output? **(Load-bearing — verify against actual pod logs before anything else.)**
- [ ] Confirm the app-issued token claim name for the tenant key aligns with the API's `tenant_id` claim (AU-03/AU-05), so the gateway and API validate identically.

---

## Loki Multi-Tenancy and Label Enforcement

Loki offers two models for tenant isolation. They are very different in implementation and security.

### Model 2A: Native multi-tenancy (`auth_enabled: true`) — recommended

When `auth_enabled: true`, Loki requires an `X-Scope-OrgID` header on every request. Data is stored and queried per tenant ID with complete isolation — a query for tenant `abc` cannot see tenant `xyz`'s data. This is enforcement in the storage layer itself, not in any component we build.

**The key enabler: per-log-line tenant routing at the collector.** Shared multi-tenant pods are not a blocker. Alloy's `loki.process` pipeline supports a `stage.tenant` block that sets the Loki tenant ID per log line, sourced from a label or a field extracted from the log body:

```text
stage.json  { expressions = { wallet_id = "wallet_id" } }   // extract from structured log
stage.tenant { source = "wallet_id" }                        // route line to that Loki tenant
```

A single Traction pod's log stream is split by the collector into per-tenant Loki tenants based on the `wallet_id` in each line. Lines with no extractable identifier fall through to a default platform tenant, so services not yet in scope (vc-authn-oidc, Endorser, Mediator — post-MVP) keep working unchanged. Using the raw identifier (e.g. `wallet_id`) as the Loki tenant ID keeps the Alloy config **static** — no per-tenant collector config or reload on tenant onboarding. Our Alloy already runs a `loki.process` pipeline per namespace, so this is a config change, not new infrastructure.

**Cross-tenant querying**: tenant IDs can be pipe-joined in the header (`X-Scope-OrgID: a|b|…`) when `multi_tenant_queries_enabled: true` is set. **This is required even for MVP**: each tenant's scope already spans **two** Loki tenants — its vc-common-service stream (under `tenant_id`) and its Traction stream (under `wallet_id`) — so the gateway sets `X-Scope-OrgID: tenant_id|wallet_id`. Platform dashboards pipe-join across all tenants the same way.

**Migration**: none needed. Existing data stays under tenant `"fake"`; platform dashboards query `"fake"` plus new per-tenant IDs (pipe-joined). Tenant-scoped views only see data ingested after the switch — tenants are new consumers with no historical-data expectation.

**Scale**: Loki is designed for very large tenant counts (Grafana Cloud operates it at orders of magnitude beyond our scale). At thousands of tenants the practical considerations are per-tenant object-storage overhead for tiny tenants (acceptable) and keeping `limits_config` defaults sane. Per-tenant rate limits and retention come for free.

### Model 2B: Label-based filtering without enforcement — rejected

Keep `auth_enabled: false`, add a `tenant_id` Loki label to streams, and constrain dashboard queries via variables (`{tenant_id="xxx"}`).

This provides **no security boundary**. OSS Loki has no query-level label enforcement, and Grafana-side restrictions don't close the gap: any authenticated Grafana user — Viewer included — can POST arbitrary LogQL directly to Grafana's datasource query API (`/api/ds/query`) with their session cookie, against any datasource in their org. Restricting dashboard editing or disabling Explore is UX, never a security boundary. Real enforcement must live at the datasource/backend level. Given the issue's explicit enforcement requirement, this model is out.

### Model 2C: Query-rewriting proxy — rejected

A proxy in front of Loki parses incoming LogQL and injects a mandatory label matcher per tenant (`loki-multi-tenant-proxy` is an — largely unmaintained — open-source example).

Rejected because it places query-parsing logic in the security-critical path to achieve what Loki's native tenancy (Model 2A) already provides. Note the distinction from the identity-aware gateway in the recommended architecture: that gateway **never touches the query** — it only maps an authenticated identity to an `X-Scope-OrgID` header value, and Loki does the enforcing. Header mapping is a few dozen lines of logic; LogQL rewriting is a parser you must keep correct forever.

### Loki findings summary

| Capability | OSS Loki | Notes |
|-----------|----------|-------|
| Multi-tenancy (storage isolation) | ✅ (`auth_enabled: true`) | Recommended; no data migration needed |
| Per-log-line tenant routing at collector | ✅ (Alloy `stage.tenant`) | Works with shared multi-tenant pods |
| Cross-tenant queries (pipe-joined IDs) | ✅ (`multi_tenant_queries_enabled`) | Used for tenant scopes and platform views |
| Label-based query filtering | ✅ (no enforcement) | UX only — not a security boundary |
| Query-level label enforcement | ❌ | Not available in OSS |
| Per-tenant rate limits / retention | ✅ (in multi-tenant mode) | `limits_config` per tenant |

### Open questions

- [ ] Confirm Alloy chart version supports `stage.tenant` (it is a long-standing Promtail-lineage stage; expected yes)
- [ ] Validate write-path behavior when `auth_enabled` flips to true — SeaweedFS layout gains per-tenant prefixes; confirm nothing in our gateway/nginx strips or overwrites `X-Scope-OrgID`
- [ ] Decide the default/fallback tenant name for unattributed lines (e.g. keep `"fake"` vs. an explicit `platform` tenant)
- [ ] Object-storage overhead check: index/chunk footprint for a large number of low-volume tenants in SeaweedFS

---

## Grafana Access Layer at Scale

### The scale constraint rules out per-tenant Grafana resources

Grafana OSS organizations provide real isolation (per-org dashboards, datasources, users), and OIDC `org_mapping` can route users to orgs. On paper, "one org + one datasource per tenant" gives clean isolation. **At hundreds to thousands of tenants this collapses**:

- Thousands of orgs, datasources, and dashboard copies to create, migrate, and keep in sync on every dashboard change and every Grafana upgrade
- Grafana's own guidance discourages heavy multi-org use (maintained, but not a development focus; newer features are org-1-centric)
- Cross-org automation requires server-admin (basic auth) credentials — a wide-blast-radius credential exercised on every onboarding
- Admin UX (org switcher, user management) degrades badly at that count

Per-tenant Grafana resources are therefore **rejected**. The access layer must have near-zero per-tenant cost.

### Scalable model: one shared tenant org + identity-aware gateway

The design that scales is to move tenant identity out of Grafana configuration entirely and derive it from the **authenticated user's token at query time**:

1. **Two orgs, total** (not per tenant): org 1 stays as-is for the platform team; one additional org **"Tenants"** hosts all tenant users as Viewers.
2. **One Loki datasource** in the Tenants org, with **"Forward OAuth Identity"** (`oauthPassThru: true`) enabled — Grafana forwards the logged-in user's **app-issued access token** (from vc-common-service's `oidc-provider`) with every datasource request.
3. **An identity-aware gateway** (small NestJS/Go service, or nginx `auth_request` + a resolver) sits between that datasource and Loki. Per request it: validates the app-issued JWT against vc-common-service's JWKS (same validation as the API's guard, AU-03); reads `tenant_id` from the token claim; looks up the `wallet_id` in the registry (cached); sets `X-Scope-OrgID: tenant_id|wallet_id` (both the vc-common-service and Traction streams); strips the Authorization header; forwards to Loki. It never reads the query.
4. **Generic shared dashboards**: because data scoping comes from identity, a single set of dashboards serves every tenant — each tenant sees only their own data in the same dashboard. No per-tenant dashboard provisioning, no template variable substitution, and Explore is safe too.

**Per-tenant footprint in this model: zero Grafana objects.** Onboarding touches only the registry (the tenant binding is the app-issued `tenant_id` claim vc-common-service already mints).

Grafana is registered once as an `authorization_code` (interactive, PKCE) client of vc-common-service's `oidc-provider`. A single static `org_mapping` rule routes all tenant users → org "Tenants" as Viewer, keyed on an app-issued claim — no Keycloak group design, and no per-tenant mapping.

**Trade-offs to carry into implementation:**

- The gateway is a custom component in the security path. This is acceptable because its job is narrow (JWT validation + header mapping — no query parsing), it fails closed, and it is the same pattern Grafana Enterprise LBAC and Mimir/GEM gateways implement commercially. It must be treated as security-critical code: reviewed, tested, minimal.
- `oauthPassThru` forwards the user's app-issued access token; token lifetime must comfortably exceed dashboard refresh intervals. Because vc-common-service issues and refreshes these tokens (AU-01/AU-08), lifetime is ours to configure — but the access token must be a **JWT carrying `tenant_id`** (configure `oidc-provider` for JWT access tokens) and scoped with an audience the gateway accepts (`aud = loki-gateway`, via resource indicator), so the gateway can validate statelessly.
- Grafana **alerting** evaluates rules server-side with no user identity — per-tenant alerting does not work in this model and is out of scope.
- Tenant users share the "Tenants" org, so they can see the same *dashboard definitions* (not data). Dashboards must not embed anything tenant-specific.

### Public dashboards / embedding

- Public dashboards (shareable external URLs without login) are available in Grafana OSS, but template variables are NOT supported in them — a parameterized per-tenant public URL is not possible. Not usable here.
- iframe embedding of authenticated Grafana works (`allow_embedding = true` required) and composes with this model, since scoping follows the logged-in user — relevant if vc-common-service later wants to embed panels in its console.

### Grafana findings summary

| Capability | OSS Grafana 13 | Notes |
|-----------|---------------|-------|
| Per-tenant orgs/datasources | ✅ but **rejected** | Does not scale to hundreds/thousands of tenants |
| Forward OAuth identity to datasource | ✅ (`oauthPassThru`) | The key enabler for the gateway model |
| OIDC client of vc-common-service | ✅ (generic OAuth) | Grafana points at the app `oidc-provider`, not Keycloak directly |
| App-claim → org mapping | ✅ (`org_mapping`) | One static rule (all tenants → shared org) |
| Datasource permissions within an org | ❌ Enterprise only | Not needed — scoping is identity-based |
| Public dashboards | ✅ | No variable support; not usable here |
| Folder permissions | ✅ in OSS | Available if platform/tenant dashboards must coexist in one org |

### Open questions

- [ ] Confirm `oidc-provider` is configured for **interactive `authorization_code` + PKCE** (AU-01) and **JWT access tokens** carrying `tenant_id` — the gateway depends on both.
- [ ] Validate `oauthPassThru` + app-token refresh behavior in our Grafana version (long-lived dashboard sessions).
- [ ] Gateway placement: standalone deployment vs. part of the existing Loki gateway/nginx layer.
- [ ] Is `allow_embedding = true` set in grafana.ini? (Only relevant for the embedding option.)

---

## Self-Serve Provisioning Flow

With the identity-aware gateway model, per-tenant provisioning becomes **thin** — there are no Grafana objects to create per tenant.

### Trigger point

vc-common-service is the source of truth for tenant lifecycle. When a tenant is provisioned/configured, downstream actions fire — as part of the same onboarding transaction vc-common-service already runs (it is greenfield; design the hooks in).

### Provisioning steps (per tenant)

1. Write the registry row `tenant_id → wallet_id` (Tenant Identity section) — the same row vc-common-service records when it creates the tenant's Traction wallet.
2. — that's it. The tenant binding is the app-issued `tenant_id` claim vc-common-service already mints at login; the gateway resolves `wallet_id` at query time; dashboards are shared.

One-time (not per-tenant) setup: the "Tenants" Grafana org, the OAuth-forwarding datasource, the generic dashboard set (JSON in the gitops repo, provisioned normally), the static `org_mapping` rule, Grafana registered as an OIDC client of vc-common-service, and the gateway deployment.

If a tenant later gains a new identifier (e.g. a second wallet), the registry row is updated; the gateway's next cache refresh picks it up. No Grafana interaction.

### Tools

Because per-tenant provisioning reduces to "write a registry row," no dedicated provisioning machinery (Terraform provider, Grafana Operator, provisioner service) is needed. The one-time Grafana + OIDC-client setup uses the normal gitops path.

### Open questions

- [ ] Gateway registry lookup: direct DB read vs. an internal API on vc-common-service; cache TTL and invalidation on registry updates.
- [ ] Should generic tenant dashboards be per-env (dev/test/prod datasources) or start with one env?

---

## Auth Integration and Security Boundaries

### Current auth model

Today, platform users log into Grafana via Keycloak SSO directly, land in org 1, and their Grafana role (`Viewer`/`Editor`/`Admin`) comes from a Keycloak role claim. This platform-team setup stays as-is.

### Target model for tenants

Tenant end-users authenticate through **vc-common-service's `oidc-provider`**, which federates upstream to Keycloak for the actual login. Grafana is an OIDC client of vc-common-service — not of Keycloak directly. On login:

1. Grafana redirects to vc-common-service's `/oidc/auth` (authorization_code + PKCE).
2. vc-common-service has no session → federates upstream to Keycloak; the user authenticates there.
3. vc-common-service resolves the user → `tenant_id`, scopes, roles, and issues its **own** JWT access token (`tenant_id` claim, `aud = loki-gateway`).
4. A static `org_mapping` rule routes the user to the shared "Tenants" org as `Viewer`.
5. On each dashboard query, Grafana forwards the app token (`oauthPassThru`) to the gateway; the gateway validates it against vc-common-service's JWKS, resolves `tenant_id → wallet_id`, sets `X-Scope-OrgID: tenant_id|wallet_id`; Loki returns only that tenant's vc-common-service + Traction streams.

This is the same token model the VC API consumers use — the gateway validates observability queries exactly the way the API's guard (AU-03) validates everything else.

### The security principle: Grafana roles are UX, the identity-scoped backend is the boundary

A foundational point that shapes the whole design: any authenticated Grafana user — Viewer included — can POST arbitrary queries directly to Grafana's datasource query API (`/api/ds/query`) using their session cookie, against any datasource in their org. Viewer role, dashboard permissions, and Explore visibility restrict the **UI**, not the query path. Therefore:

- Restricting tenants to Viewer role prevents accidental misuse, not attack
- "Disable Explore" is not a mitigation
- The enforcement chain must be: app token → gateway (identity → tenant scope) → Loki (`X-Scope-OrgID` isolation). Every element of that chain is outside the tenant's control.

Under this model a tenant can hand-craft any LogQL they like — through Explore, `/api/ds/query`, or curl — and Loki will only ever return streams belonging to their own tenant scope.

### Security boundary analysis

| Threat | Recommended architecture (identity gateway + Loki multi-tenant) | Shared datasource, label filtering only |
|--------|------------------------------------------------------------------|------------------------------------------|
| Tenant sees another tenant's data via dashboards | Prevented — scope derived from their own token | Not prevented (edit variable/query) |
| Tenant queries another tenant's raw logs (Explore or direct `/api/ds/query`) | **Prevented — gateway sets scope from the validated app JWT; Loki enforces** | **Not prevented** |
| Tenant spoofs `X-Scope-OrgID` | Prevented — gateway strips/sets the header itself; Loki is not directly reachable from Grafana users | n/a |
| Tenant replays another user's token | Standard OIDC threat — token validation, short lifetimes, TLS | n/a |
| Platform/admin sees all tenant data | By design (platform org datasource bypasses the tenant gateway or uses a pipe-joined admin scope) | By design |

**Network requirement**: Loki must only be reachable via the gateway (and via the platform path) — NetworkPolicy so that nothing else in-cluster can hit Loki's query endpoints with an arbitrary `X-Scope-OrgID`.

### vc-common-service oidc-provider integration specifics

- Grafana registers as an `authorization_code` (interactive, PKCE) client in `oidc-provider` (AU-01). Note: API client registration (AU-06) is oriented to `client_credentials` machine clients today — interactive-client support may need a small extension, or Grafana can be registered out-of-band.
- `oidc-provider` must federate the browser login upstream to Keycloak — AU-02 must cover the **interactive** flow, not just backend token exchange.
- Access tokens must be **JWTs carrying `tenant_id`** (`oidc-provider` issues opaque tokens by default; enable JWT access tokens). Alternatively the gateway introspects, but JWT is preferred for stateless validation.
- Scope the gateway audience via resource indicator (`aud = loki-gateway`).
- **Availability coupling**: vc-common-service is now in Grafana's login path — if it's down, tenants can't log into Grafana, but they also can't use the API, so the blast radius is already shared.

### Open questions

- [ ] Does `oidc-provider` (AU-01) support interactive authorization_code + PKCE with upstream Keycloak federation (AU-02) for browser login?
- [ ] Enable JWT access tokens in `oidc-provider` (vs. opaque + introspection); confirm `tenant_id` + `aud` claims.
- [ ] Extend API client registration (AU-06) to cover interactive clients, or register Grafana out-of-band?
- [ ] What does the security review process look like for exposing observability data to external tenants?
- [ ] NetworkPolicy design so Loki query endpoints are reachable only via the gateway and platform paths.

---

## Tracing & Metrics (platform-internal)

Traces and metrics are **platform-internal for MVP** — tenants get logs and dashboards; traces are for us when assisting them. Tenant-facing scope is logs, deliberately.

### Tracing for MVP: vc-common-service ↔ Traction

OpenTelemetry propagates trace context via the W3C `traceparent` HTTP header, so the HTTP hops that matter for MVP join one trace with standard auto-instrumentation:

- vc-common-service → Traction API, Traction → ACA-Py admin/webhooks: covered by OTel auto-instrumentation (OB-01), plus custom spans for credential operations (OB-02). `tenant.id` is set as a span attribute at the request boundary.

DIDComm hops (Traction ↔ Mediator/Endorser) carry no `traceparent` and break the trace by default. That boundary is out of scope for MVP; when it matters, correlate at the edges by the Aries `thread_id` (already emitted in the protocol) rather than bridging Aries RFC 0034 into OTel. Cross-chain tracing across vc-authn-oidc / Endorser / Mediator is post-MVP.

### Tenancy model for traces and metrics

Keep traces single-tenant (platform), attribute-tagged:

- All spans go to one platform Tempo tenant; services set `tenant.id` (and where relevant `wallet_id`, `thread_id`) as span attributes.
- Platform engineers filter with TraceQL: `{ span.tenant.id = "tenant-456" }`.
- Per-tenant trace *ingest routing* has no `stage.tenant` equivalent for OTLP and is materially harder than logs — not worth it for MVP. If tenant-facing traces are ever needed, the identity-aware gateway pattern extends to Tempo (same `X-Scope-OrgID` semantics).

The same applies to **metrics**: ACA-Py emits no per-wallet metrics, so there is nothing to route per-tenant. Keep metrics platform-internal (OB-04).

### Open questions

- [ ] Confirm which OTel components the in-flight instrumentation rollout standardizes on (SDK versions, Alloy `otelcol.*` pipeline).
- [ ] Tempo version — confirm `multitenancy_enabled` and TraceQL attribute filtering (expected yes on any recent version).
- [ ] Sampling strategy: 100% for low-volume VC flows initially, or head sampling from the start?

---

## Recommended Architecture

Bringing the categories together:

```text
 vc-common-service ──HTTP (X-Wallet-ID)──▶ Traction / ACA-Py
        │  structured logs (tenant_id)         │  structured logs (wallet_id)
        ▼                                      ▼
     Alloy (per-namespace loki.process)
        │  stage.json/regex → stage.tenant
        │  (line routed to Loki tenant = tenant_id / wallet_id;
        │   unattributed lines → platform tenant)
        ▼
     Loki (auth_enabled: true)          ← reachable only via gateway
        ▲
        │  X-Scope-OrgID: <tenant_id>|<wallet_id>
     identity-aware gateway
        ▲  validates app-issued JWT (vc-common-service JWKS) → tenant_id → registry → wallet_id
        │  (forwarded app token; no query parsing)
     Grafana org "Tenants" — ONE datasource (oauthPassThru),
     ONE set of generic dashboards, shared by ALL tenants
        ▲
     vc-common-service oidc-provider  ──federates──▶  Keycloak (upstream login)
        (Grafana = OIDC client; static org_mapping rule)
```

1. **Ingestion**: Alloy extracts `tenant_id` (vc-common-service) or `wallet_id` (Traction/ACA-Py) from structured logs and routes each line to a Loki tenant named after it (`stage.tenant`). Loki runs with `auth_enabled: true`. Unattributed lines fall through to the platform tenant. Alloy config is static — onboarding a tenant touches no collector config.
2. **Identity registry**: vc-common-service records `tenant_id → wallet_id` at onboarding — one row, consumed by the gateway at query time (cached).
3. **Access layer with zero per-tenant Grafana resources**: one shared "Tenants" org, one OAuth-forwarding datasource, one generic dashboard set. The identity-aware gateway turns the user's validated app JWT into an `X-Scope-OrgID`; Loki enforces it. Tenants can use dashboards, Explore, or raw API calls freely — they only ever see their own data.
4. **Per-tenant onboarding cost**: a single registry row. The tenant binding is the app-issued `tenant_id` claim vc-common-service already mints — no Keycloak group. This is what makes the design hold at hundreds or thousands of tenants.
5. **Traces and metrics**: platform-internal, tagged with `tenant.id` attributes, filtered via TraceQL/PromQL when assisting tenants.
6. **Migration**: none. Existing `"fake"`-tenant data remains queryable by platform; tenant scopes fill from cutover onward.

The one custom component is the gateway — deliberately narrow (app-JWT validation + header mapping, no query parsing), the same pattern Grafana Enterprise LBAC and Mimir/GEM gateways implement. It must be treated as security-critical: minimal, reviewed, failing closed, with Loki network-isolated behind it.

### Decision: Grafana (this design) over an in-app console

An alternative was considered: since vc-common-service is greenfield and owns tenant identity and auth, it could query Loki server-side (setting `X-Scope-OrgID` from the registry) and render log views in its own tenant console — this is what requirements **OB-07** (Loki-backed log query service) + **UI-08** (terminal console) originally described.

**Decision: use Grafana** (this design), superseding OB-07 + UI-08. Both options share the same foundation (Loki multi-tenancy + registry + Alloy extraction) and the same identity-to-scope logic; the difference is only whether the UI is Grafana dashboards or in-app console views. Grafana was chosen for out-of-the-box dashboards, ad-hoc exploration, and parity with the platform's own tooling. An in-app console (e.g. embedding Grafana panels via `allow_embedding`) remains a future option with no wasted foundation work.

### Phased plan

```text
PoC (now)           → Verify ACA-Py logs wallet_id in structured JSON (load-bearing check).
                      Alloy stage.json/stage.regex + stage.tenant for Traction/ACA-Py logs;
                      enable Loki auth_enabled: true in dev; validate isolation end-to-end
                      by curling Loki through a stub gateway with different wallet scopes.

Phase 2 (near-term) → Registry (tenant_id → wallet_id) in vc-common-service; identity-aware
                      gateway (validates app-issued JWT, sets X-Scope-OrgID); Grafana as OIDC
                      client of vc-common-service + JWT access tokens; shared Tenants org,
                      datasource, generic dashboards; NetworkPolicy isolating Loki.

Phase 3 (parallel)  → OTel auto-instrumentation for vc-common-service ↔ Traction as part of the
                      in-flight OTel rollout; tenant.id span attributes; platform-internal
                      Tempo + TraceQL for tenant support.
```

---

## Feasibility Summary

### Low effort / low risk

| Capability | Effort | Risk | Notes |
|-----------|--------|------|-------|
| Alloy `stage.tenant` routing for Traction logs | Low | Low | Config change in existing pipeline; gated on log-format verification |
| Loki `auth_enabled: true` | Low–Medium | Low | No data migration; validate gateway header handling |
| Generic shared dashboards | Low | Low | One set for all tenants; scoping comes from identity |
| Static `org_mapping` + shared Tenants org | Low | Low | One-time setup, not per-tenant |

### Medium effort

| Capability | Effort | Risk | Notes |
|-----------|--------|------|-------|
| Identity-aware gateway | Medium | Medium | Security-critical but narrow (app JWT → header); needs review + NetworkPolicy isolation of Loki |
| Grafana as OIDC client of vc-common-service | Medium | Low | Register interactive client; JWT access tokens with `tenant_id` + `aud` |
| oidc-provider interactive flow + JWT access tokens | Medium | Low | AU-01/AU-02 must cover browser authorization_code + upstream Keycloak federation |
| OTel auto-instrumentation (vc-common-service ↔ Traction) | Medium | Low | No upstream code changes; part of in-flight rollout |

### High effort / deferred

| Capability | Effort | Risk | Notes |
|-----------|--------|------|-------|
| DIDComm-boundary trace continuity (RFC 0034 bridge) | High | Medium | Deferred; correlate via thread_id attributes instead |
| Cross-service correlation (vc-authn / Endorser / Mediator) | High | Medium | Post-MVP; needs dynamic multi-identifier registry + DIDComm work |
| Per-tenant metrics | High | Medium | No per-wallet metrics exist upstream; revisit with OTel maturity |
| Tenant-facing traces (per-tenant Tempo ingest routing) | High | Medium | No stage.tenant equivalent for OTLP; platform-internal traces instead |
| Per-tenant Grafana orgs/datasources | — | — | **Rejected**: does not scale to hundreds/thousands of tenants |

---

## Open Questions Master List

> Collected from all categories above. Triage and assign before implementation begins.

**Identity & Data**
- [ ] Does ACA-Py in our Traction deployment log `wallet_id` in structured JSON? **(Blocks everything — verify first.)**
- [ ] Confirm the app-issued token claim name for the tenant key aligns with the API's `tenant_id` claim (AU-03/AU-05).

**Loki / Alloy**
- [ ] Confirm our Alloy version supports `stage.tenant`
- [ ] Validate `auth_enabled: true` cutover in dev (gateway header handling, SeaweedFS layout)
- [ ] Default tenant name for unattributed lines
- [ ] Object-storage overhead for many low-volume tenants

**Access layer / Auth**
- [ ] `oidc-provider`: interactive authorization_code + PKCE with upstream Keycloak federation (AU-01/AU-02)?
- [ ] Enable JWT access tokens with `tenant_id` + `aud = loki-gateway` (vs. opaque + introspection)
- [ ] Extend API client registration (AU-06) for interactive clients, or register Grafana out-of-band?
- [ ] Validate `oauthPassThru` + app-token refresh in our Grafana version
- [ ] Gateway registry lookup path (DB vs. internal API), cache TTL/invalidation
- [ ] NetworkPolicy so Loki is reachable only via gateway + platform paths

**Tracing & Metrics (platform-internal)**
- [ ] OTel components/versions standardized by the in-flight rollout
- [ ] Tempo version + `multitenancy_enabled` availability
- [ ] Sampling strategy

**Security**
- [ ] Security review process for exposing observability data to external tenants

---

## References

- [Loki Multi-Tenancy](https://grafana.com/docs/loki/latest/operations/multi-tenancy/)
- [Alloy `loki.process` — `stage.tenant`](https://grafana.com/docs/alloy/latest/reference/components/loki/loki.process/)
- [Grafana data source settings — Forward OAuth Identity](https://grafana.com/docs/grafana/latest/administration/data-source-management/)
- [Grafana Generic OAuth Configuration](https://grafana.com/docs/grafana/latest/setup-grafana/configure-security/configure-authentication/generic-oauth/)
- [Grafana OSS Organization Management](https://grafana.com/docs/grafana/latest/administration/organization-management/)
- [Tempo Multi-Tenancy](https://grafana.com/docs/tempo/latest/operations/manage-advanced-systems/multitenancy/)
- [Tempo Cross-Tenant Query Federation](https://grafana.com/docs/tempo/latest/operations/manage-advanced-systems/cross_tenant_query/)
- [Aries RFC 0034: Message Tracing](https://identity.foundation/aries-rfcs/latest/features/0034-message-tracing/)
- Our Grafana config: [infra/monitoring/grafana/values.yaml](../infra/monitoring/grafana/values.yaml)
- Our Loki config: [infra/monitoring/loki/chart/values.yaml](../infra/monitoring/loki/chart/values.yaml)
- Our Alloy config: [infra/monitoring/alloy/values.yaml](../infra/monitoring/alloy/values.yaml)
- Loki architecture doc: [observability/loki-architecture.md](../observability/loki-architecture.md)
- Grafana/Alloy architecture doc: [observability/grafana-alloy-architecture.md](../observability/grafana-alloy-architecture.md)
