# TechConnect

A lightweight developer social platform — post tech updates, follow peers, and like what matters.

> Built as a full-stack MVP exercise covering complex relational DB modeling, high-frequency interactions, and infinite-scroll UX.

<!-- TODO: 补充截图或演示链接 -->

---

## Features

| Feature | Status |
|---|---|
| User registration & login (bcrypt + JWT) | ✅ |
| Post creation & deletion (author only) | ✅ |
| Public feed (cursor-based pagination) | ✅ |
| Following feed (only people you follow) | ✅ |
| Infinite scroll | ✅ |
| Like / unlike toggle with optimistic update | ✅ |
| Follow / unfollow toggle | ✅ |
| User profile (followers, following, post count) | ✅ |
| Comments | 🚧 |
| Keyword search (`GET /posts?q=`) | 🚧 |
| Responsive design (mobile) | 🚧 |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| State | Zustand |
| HTTP client | Axios |
| Backend | Hono, Node.js, TypeScript |
| ORM | Prisma 7 |
| Database | PostgreSQL 16 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Testing | Vitest, Testing Library, MSW |

---

## Quick Start

See [SETUP.md](./SETUP.md) for full instructions.

```bash
# 1. Start database
docker compose up -d

# 2. Backend
cd backend && npm install && npx prisma migrate deploy && npm run seed && npm run dev

# 3. Frontend (new terminal)
cd frontend && npm install && npm run dev
```

Open http://localhost:5173. Seed users: `alice / bob / charlie / diana`, password: `password123`.

---

## Database Design

```
User ──< Post          (one-to-many)
User ──< Like >── Post (many-to-many, composite PK userId+postId)
User ──< Follow >── User (self-referential, composite PK followerId+followingId)
Post ──< Comment       (schema ready, API pending)
```

**Key decisions:**

- **`likeCount` redundant field** on `Post`: avoids a real-time `COUNT(*)` join on every feed query. Updated atomically inside a Prisma transaction on every like/unlike.
- **Cursor-based pagination** (by `createdAt + id`) instead of `LIMIT/OFFSET`: no duplicate rows when new posts are inserted mid-scroll.
- **Zustand** over Redux: sufficient for this scale, no boilerplate.

---

## Project Structure

```
techconnect/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # DB schema & relations
│   │   ├── migrations/        # Migration history
│   │   └── seed.ts            # Dev seed data
│   └── src/
│       ├── modules/           # Feature modules (auth / post / like / follow)
│       │   └── <feature>/
│       │       ├── *.routes.ts
│       │       └── *.service.ts
│       ├── middleware/        # JWT auth middleware
│       ├── lib/               # Prisma client singleton
│       ├── app.ts             # Hono app + route mounting
│       └── index.ts           # Entry point
└── frontend/
    └── src/
        ├── api/               # Axios wrappers (auth / posts / likes)
        ├── stores/            # Zustand stores (auth / feed / like / profile)
        ├── components/        # PostCard, LikeButton
        ├── pages/             # FeedPage, LoginPage, RegisterPage, ProfilePage
        └── hooks/             # useInfiniteScroll
```

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register new user |
| POST | `/auth/login` | — | Login, returns JWT |
| GET | `/posts` | ✓ | Public feed (cursor pagination) |
| GET | `/posts?feed=following` | ✓ | Following feed |
| POST | `/posts` | ✓ | Create post |
| DELETE | `/posts/:id` | ✓ | Delete own post |
| POST | `/posts/:id/like` | ✓ | Toggle like |
| POST | `/users/:id/follow` | ✓ | Toggle follow |
| GET | `/users/:id/profile` | ✓ | Profile + stats |
| GET | `/health` | — | Health check |

---

## Known Issues / Roadmap

See [TODO.md](./TODO.md).
