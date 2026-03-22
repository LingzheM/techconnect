# TODO

## 🔴 Blocking

These will prevent others from running the project after a fresh clone.

- [ ] Create `backend/.env.example` with all required variables documented
- [ ] Create `frontend/.env.example` with `VITE_API_URL` documented
- [ ] Remove hardcoded `'fallback-secret'` JWT default — fail fast with a clear error if `JWT_SECRET` is unset
  - `backend/src/middleware/auth.middleware.ts:4`
  - `backend/src/modules/auth/auth.service.ts:5`

---

## 🟡 Polish

Code works but has rough edges.

- [ ] Like/Follow routes re-throw unhandled Prisma errors → callers get a raw 500 with no JSON body
  - `backend/src/modules/like/like.routes.ts:17`
  - `backend/src/modules/follow/follow.routes.ts:17`, `:30`
- [ ] `ProfilePage` has no `.catch()` on the profile fetch — silent blank screen on network error
  - `frontend/src/pages/ProfilePage.tsx:27`
- [ ] Test fixture typo: `avataUrl` → `avatarUrl` causes type mismatch in PostCard tests
  - `frontend/src/pages/FeedPage.test.tsx:29`
- [ ] `CORS_ORIGIN` is hardcoded as fallback in `app.ts` — move fully to env var, document in `.env.example`
  - `backend/src/app.ts:11`
- [ ] No Node.js version pinned — add `.nvmrc` or `"engines"` field in both `package.json` files

---

## 💡 Upcoming Features

Planned but not yet implemented.

- [ ] **Comment API** — schema is ready (`Comment` model in `schema.prisma`), routes + service not built
- [ ] **Keyword search** — `GET /posts?q=<term>` backend endpoint
- [ ] **ProfilePage UI** — page exists as a stub, needs `profileStore` wired up and profile data rendered
- [ ] **Comment UI** — depends on Comment API
- [ ] **Search UI** — depends on keyword search endpoint
- [ ] **Responsive design** — Tailwind breakpoints, mobile-first layout pass
- [ ] **README: ER diagram** — add a visual diagram (e.g. Mermaid) to README
- [ ] **CI badge** — GitHub Actions workflow exists (`.github/`), add status badge to README
