# AI Development Rules & Guidelines

This document establishes the strict standards for all AI-generated code in this project. All contributions must adhere to these rules.

## 1. Strict Type Safety

- **No `any`**: The usage of `any` is strictly prohibited. Always define specific interfaces or types.
- **Prisma Types**: Leverage generated Prisma types (e.g., `import { User, Task } from '@prisma/client'`) instead of manually redefining them.
- **DTOs**: Create Data Transfer Object (DTO) interfaces for all API request bodies and response objects.
- **Express Extensions**: Ensure `req.user` and other custom properties are properly typed in `src/types/express.d.ts`.

## 2. Authentication & Middleware

- **Security First**: Every new route must be evaluated for access control.
- **Role-Based Access**: Use the `authorizeRoles` middleware for all protected routes.
  - Example: `router.post('/admin', authMiddleware, authorizeRoles(['TechHead', 'President']), controller)`
- **Context Awareness**: Always check `src/middleware/auth.middleware.ts` to understand the current authentication logic and available user roles (`TechHead`, `President`, `cabinet`, `Member`).

## 3. Database & Schema Synchronization

- **Schema as Source of Truth**: Always consult `src/prisma/schema.prisma` before writing any database query.
- **Schema Updates**:
  - If a feature requires a schema change, **STOP** and propose the schema change first.
  - Upon schema modification:
    1.  Run `npx prisma generate`.
    2.  Run `npx prisma migrate dev` (or `push` for prototyping).
    3.  Update all affected TypeScript interfaces/types.
    4.  Update `src/types/express.d.ts` if user roles or attributes change.
    5.  Refactor all dependent controllers and services.

## 4. Functionality & Error Handling

- **Edge Cases**: Handle null checks, undefined values, and empty arrays explicitly.
- **HTTP Status Codes**: Use appropriate status codes (200, 201, 400, 401, 403, 404, 500).
- **Async/Await**: Always use `try/catch` blocks in async controllers and pass errors to the global error handler using `next(error)`.

## 5. Code Structure

- **Modularization**: Keep controllers, services, and routes separated.
- **Environment Variables**: Never hardcode secrets. Use `process.env` and ensure they are defined in `.env` and `env.example`.
