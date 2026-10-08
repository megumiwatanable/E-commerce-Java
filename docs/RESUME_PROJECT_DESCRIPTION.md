# Resume Project Description

## E-Commerce Order Management System

### Project Overview
Full-stack microservices-based e-commerce platform with event-driven architecture using Java, Spring Boot, Kafka, Angular, and MySQL.

### Bullet Points (for resume)

1. **Developed a microservices-based e-commerce platform** using Java 17, Spring Boot 3.2, REST APIs, Apache Kafka, Angular 17, and MySQL with 7 independent microservices.

2. **Implemented event-driven order processing** using Kafka topics (order-events, inventory-events, payment-events) for asynchronous communication between Order, Inventory, Payment, and Notification services.

3. **Built JWT-based authentication and role-based authorization** with Spring Security, BCrypt password hashing, and API Gateway-level token validation supporting Customer and Admin roles.

4. **Designed inventory reservation and release workflows** with optimistic locking (@Version) to handle concurrent updates, including automatic stock release on payment failure via Kafka events.

5. **Developed responsive Angular 17 storefront and admin dashboard** with lazy-loaded routes, route guards, HTTP interceptors, RxJS state management, and real-time API integration.

6. **Containerized the entire application** using Docker and Docker Compose with multi-stage builds, MySQL, Kafka, Zookeeper, and health-check-based service orchestration.

### Project Details
- **Duration**: Portfolio Project
- **Role**: Full Stack Developer
- **Team Size**: Individual

### Key Technologies
- **Backend**: Java 17, Spring Boot 3.2, Spring Security, Spring Data JPA, Spring Cloud Gateway, Spring Kafka
- **Frontend**: Angular 17, TypeScript, RxJS, Angular Reactive Forms
- **Database**: MySQL 8.0 (6 separate schemas)
- **Messaging**: Apache Kafka
- **DevOps**: Docker, Docker Compose
- **Testing**: JUnit 5, Mockito, MockMvc
- **API Docs**: SpringDoc OpenAPI (Swagger)
