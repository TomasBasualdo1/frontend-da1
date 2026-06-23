# E2E Tests — DA1 (Maestro)

End-to-end tests for the DA1 mobile auction app using [Maestro](https://maestro.mobile.dev/).

## Quick Start

```bash
# 1. Install Maestro
curl -Ls "https://get.maestro.mobile.dev" | bash

# 2. Seed test data
DATABASE_URL="postgresql://..." ./e2e/scripts/setup.sh

# 3. Run all tests
./e2e/scripts/run-all.sh

# 4. Run a specific suite
maestro test e2e/flows/suite01-auth/

# 5. Clean up
DATABASE_URL="postgresql://..." ./e2e/scripts/teardown.sh
```

## Structure

```
e2e/
├── .maestro.env                    (environment variables)
├── flows/
│   ├── _helpers/                   (reusable subflows)
│   │   ├── login.yaml             (login as USUARIO_VALIDO)
│   │   ├── login-admin.yaml       (login as ADMIN)
│   │   ├── logout.yaml            (logout from profile)
│   │   └── clear-state.yaml       (stop + re-launch app)
│   ├── suite01-auth/              (13 tests)
│   ├── suite02-subastas-invitado/ (4 tests)
│   ├── suite03-subastas-autenticado/ (5 tests)
│   ├── suite04-perfil/            (5 tests)
│   ├── suite05-consignar/         (3 tests)
│   ├── suite06-admin/             (5 tests)
│   ├── suite07-red-offline/       (4 tests)
│   └── suite08-navegacion-ux/     (3 tests)
├── scripts/
│   ├── seed-e2e.sql               (create test data)
│   ├── rollback-e2e.sql           (clean up test data)
│   ├── setup.sh                   (seed DB + start Expo + boot Simulator)
│   ├── teardown.sh                (rollback DB)
│   └── run-all.sh                 (run all suites)
└── README.md
```

## Test Data (created by seed-e2e.sql)

| User | Documento | Password | Estado | Categoria |
|------|-----------|----------|--------|-----------|
| USUARIO_VALIDO | 12345678 | password123 | aprobado | comun |
| USUARIO_NO_APROBADO | 99999991 | password123 | pendiente | — |
| USUARIO_BLOQUEADO | 99999992 | password123 | bloqueado | — |
| ADMIN | 00000003 | 12345678 | *ya existe* | *ya existe* |

| Subasta | ID | Estado | Categoria |
|---------|-----|--------|-----------|
| SUBASTA_ABIERTA | 800010 | abierta | comun |
| SUBASTA_EN_VIVO | 800011 | abierta (hora pasada) | comun |
| SUBASTA_FINALIZADA | 800012 | cerrada | comun |

## Suites Summary

| Suite | Tests | Priority | Description |
|-------|-------|----------|-------------|
| 01-auth | 13 | High | Login, register, forgot/reset password, logout, session persistence |
| 02-subastas-invitado | 4 | High | Guest auction listing, filters, public detail, empty state |
| 03-subastas-autenticado | 5 | High | Auth listing, join, bid, confirm payment, SSE (skip CI) |
| 04-perfil | 5 | Medium | View/edit profile, payment methods, fines, auction history |
| 05-consignar | 3 | Medium | Multi-step article consignment form |
| 06-admin | 5 | Medium | User/article/payment approval, category changes |
| 07-red-offline | 4 | Medium | Network errors, 401/500 handling, pull-to-refresh |
| 08-navegacion-ux | 3 | Low | Tab navigation, back button, deep links |

## Environment Variables

Set these before running tests:

| Variable | Default | Description |
|----------|---------|-------------|
| `EXPO_PUBLIC_API_URL` | `http://localhost:8000` | Backend API URL |
| `E2E_USER_DOCUMENTO` | `12345678` | Valid test user |
| `E2E_USER_PASSWORD` | `password123` | Valid test password |
| `E2E_ADMIN_DOCUMENTO` | `00000003` | Admin user |
| `E2E_ADMIN_PASSWORD` | `12345678` | Admin password |
| `E2E_NOAPROBADO_DOCUMENTO` | `99999991` | Non-approved user |
| `E2E_BLOQUEADO_DOCUMENTO` | `99999992` | Blocked user |
| `E2E_SUBASTA_ID_ABIERTA` | `800010` | Open auction ID |
| `E2E_SUBASTA_ID_EN_VIVO` | `800011` | Live auction ID |
| `E2E_SUBASTA_ID_FINALIZADA` | `800012` | Finished auction ID |

## Known Limitations

1. **Photo upload tests (auth-11, cons-02)**: Require pre-loaded images in the iOS Simulator gallery. Use `xcrun simctl addmedia` to add test images before running.

2. **SSE test (sub-09)**: Tagged `[skip-ci]`. Requires a live auction with active SSE stream. Run manually.

3. **Network mock tests (net-02, net-03)**: Tagged `[requires-mock]`. Require a proxy (mitmproxy) to intercept and mock 500/401 responses.

4. **Session persistence (auth-09)**: Behavior may differ between Simulator and real device due to SecureStore implementation.

5. **BUG-01**: If `GET /usuarios/me` returns null, `isAuthenticated` stays `true` but `user.id === undefined`. Tests assume backend is correctly implemented.

## Running on CI

```yaml
# Example GitHub Actions workflow
- name: Run E2E Tests
  run: |
    maestro test \
      --include-tags=ci \
      --format=junit \
      e2e/flows/
```

Tests tagged `[skip-ci]` or `[requires-mock]` will be excluded from CI runs.

## Adding New Tests

1. Use existing testIDs from the component files
2. Follow the YAML structure in existing test files
3. Use `../_helpers/login.yaml` for authenticated flows
4. Add env vars to `.maestro.env` if needed
5. Update this README with new suite/description

## What's NOT Covered (unit tests handle these)

- Snake_case → camelCase normalization
- `normalizeCategoria`, `normalizeMoneda`, `normalizeNumber`
- `getAuctionScheduleStatus`, `isAuctionLive`, `isAuctionScheduled`
- Axios interceptor logic
- FormData construction in `publicar()` and `registroPaso1()`
- Idempotency-Key bid generation
- Response null/array handling
