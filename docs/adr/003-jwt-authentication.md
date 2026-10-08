# ADR-003: JWT Authentication

**Date:** 2026-08-31

## Status

Accepted

## Context

The e-commerce platform needs secure authentication and authorization. Users must be identified across services, and admin-only operations must be protected.

## Decision

We will use **JWT (JSON Web Tokens)** for stateless authentication with Spring Security.

## Alternatives Considered

1. **Session-based authentication** — Server-side sessions with cookies
2. **OAuth2 with external provider** — Google/GitHub login
3. **JWT with Spring Security** — Stateless token-based auth
4. **API keys** — Simple key-based authentication

## Reasoning

- **Stateless:** No server-side session storage needed
- **Scalable:** Works across multiple service instances
- **Microservice-friendly:** Token can be validated by any service
- **Portfolio value:** Demonstrates industry-standard security patterns

## Token Structure

```
Header: { "alg": "HS512" }
Payload: {
  "sub": "userId",
  "email": "user@example.com",
  "role": "CUSTOMER",
  "iat": timestamp,
  "exp": timestamp
}
```

## Consequences

- API Gateway validates JWT on all protected routes
- Public routes (login, register, product browsing) skip JWT validation
- Role-based access control enforced at service level
- Token expiration set to 24 hours
