# ADR-001: Microservices Architecture

**Date:** 2026-08-31

## Status

Accepted

## Context

We need to build an e-commerce platform that supports multiple business domains (users, products, inventory, orders, payments, notifications). The system must be scalable, maintainable, and demonstrate modern architectural patterns.

## Decision

We will use a **microservices architecture** with 7 independent services, each owning its own database.

## Alternatives Considered

1. **Monolithic architecture** — Single Spring Boot application with all modules
2. **Modular monolith** — Single deployable with well-separated modules
3. **Microservices** — Independent services communicating via REST and Kafka

## Reasoning

- **Team autonomy:** Each service can be developed and deployed independently
- **Technology flexibility:** Different services can use different databases if needed
- **Scalability:** Individual services can be scaled independently
- **Learning value:** Demonstrates real-world architectural patterns for portfolio

## Trade-offs

**Pros:**
- Clear service boundaries
- Independent deployment
- Fault isolation
- Technology diversity

**Cons:**
- Increased complexity
- Network overhead between services
- Distributed transaction challenges
- More infrastructure to manage

## Consequences

- We need an API Gateway for routing and cross-cutting concerns
- We need Kafka for async communication between services
- Each service needs its own database schema
- We need Docker Compose for local development
