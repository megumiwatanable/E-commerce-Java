# ADR-002: Kafka Event-Driven Processing

**Date:** 2026-08-31

## Status

Accepted

## Context

The e-commerce system needs to handle order processing, payment events, inventory updates, and notifications. These operations involve multiple services and need to be reliable and decoupled.

## Decision

We will use **Apache Kafka** for asynchronous, event-driven communication between services.

## Alternatives Considered

1. **Synchronous REST only** — All inter-service communication via HTTP
2. **RabbitMQ** — Alternative message broker
3. **Apache Kafka** — Distributed event streaming platform
4. **Database polling** — Services poll for changes

## Reasoning

- **Decoupling:** Services don't need to know about each other directly
- **Reliability:** Kafka persists messages, ensuring no events are lost
- **Scalability:** Kafka handles high throughput efficiently
- **Replay capability:** Events can be replayed for debugging or recovery
- **Industry standard:** Kafka is widely used in production systems

## Trade-offs

**Pros:**
- Loose coupling between services
- Reliable message delivery
- Event replay capability
- High throughput

**Cons:**
- Eventual consistency (not immediate)
- Increased infrastructure complexity
- Debugging distributed events is harder
- Need to handle duplicate events

## Consequences

- Services communicate via well-defined event topics
- We need consumer groups for load balancing
- We must implement idempotent event processing
- We need dead letter topics for failed messages
