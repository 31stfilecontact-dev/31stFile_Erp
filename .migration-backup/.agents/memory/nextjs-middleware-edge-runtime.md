---
name: Next.js Middleware — Edge Runtime JWT
description: Why jose fails silently in Next.js middleware and what to use instead
---

## Rule
Do NOT import `jose` (or any npm package with native/CJS internals) in `middleware.ts`. Use the **Web Crypto API** directly — it is built into the Edge Runtime and requires zero imports.

**Why:** Next.js middleware runs in the Edge Runtime (not Node.js). When `jose` is imported, Next.js may silently fail to compile the middleware, causing ALL requests to pass through unprotected with no error in the dev logs. The failure is invisible — `GET /dashboard 200` appears normal but no auth check occurred.

**How to apply:**
- For HMAC-SHA256 JWT verification in middleware: use `crypto.subtle.importKey` + `crypto.subtle.verify`
- For JWT signing (server routes, API handlers): `jose` works fine there (Node.js runtime)
- Pattern: middleware does crypto.subtle verify → API routes/server actions use jose signToken/verifyToken
