# Interview Guide — E-Commerce Order Management System

## Java

### OOP
- **Encapsulation**: Entity classes use private fields with getters/setters. Business logic is encapsulated in Service classes.
- **Inheritance**: Exception classes extend RuntimeException. Entity classes use JPA inheritance.
- **Polymorphism**: Service interfaces with multiple implementations. Kafka consumers handle different event types via switch statements.
- **Abstraction**: Service layer abstracts business logic from controllers. Repository layer abstracts data access.

### Streams
- Product filtering uses `Page<Product>` streams for mapping to DTOs
- Cart subtotal calculation: `items.stream().map(CartItem::getSubtotal).reduce(BigDecimal.ZERO, BigDecimal::add)`
- Order items mapping: `order.getItems().stream().map(this::mapOrderItemToDTO).toList()`

### Collections
- `List<OrderItem>` for order line items with `CascadeType.ALL`
- `Map<Long, ProductInfo>` in OrderService for product cache (ConcurrentHashMap)
- `List<String>` for PUBLIC_PATHS in JWT filter

### Optional
- `userRepository.findByEmail(email).orElseThrow(...)` pattern used throughout
- `inventoryRepository.findByProductId(productId).map(inv -> inv.getAvailableQuantity() >= quantity).orElse(false)`

### Exception Handling
- Custom exception hierarchy: ResourceNotFoundException, DuplicateResourceException, OrderStateException, InsufficientInventoryException
- Global exception handler with @RestControllerAdvice
- Consistent JSON error response format

---

## Spring Boot

### Dependency Injection
- Constructor injection used throughout (no @Autowired on fields)
- Service layer injected into controllers and other services
- KafkaTemplate and ObjectMapper injected into producers/consumers

### REST Controllers
- @RestController with @RequestMapping for base paths
- @GetMapping, @PostMapping, @PutMapping, @DeleteMapping
- @PathVariable, @RequestParam, @RequestBody
- @RequestHeader("X-User-Id") for passing authenticated user info from Gateway

### JPA/Hibernate
- @Entity, @Table, @Id, @GeneratedValue
- @ManyToOne, @OneToMany with cascade and fetch types
- @Version for optimistic locking in Inventory entity
- @PrePersist, @PreUpdate for timestamp management

### DTOs
- Separate Request/Response DTOs (e.g., RegisterRequest, AuthResponse)
- No JPA annotations on DTOs
- Jackson annotations for JSON serialization

### Validation
- @Valid, @NotBlank, @NotNull, @Email, @Size, @DecimalMin, @DecimalMax
- Custom error messages in annotations

### Exception Handling
- @RestControllerAdvice with @ExceptionHandler
- MethodArgumentNotValidException for validation errors
- Custom exceptions mapped to HTTP status codes

### Transactions
- @Transactional on methods that modify multiple entities
- Order creation: saves order + order items in single transaction

---

## Microservices

### Why Microservices?
Clear service boundaries — User, Product, Inventory, Order, Payment, Notification each have a single responsibility. Can be developed, deployed, and scaled independently.

### Service Boundaries
- User Service: handles authentication, user profiles
- Product Service: manages products, categories, search
- Inventory Service: stock management, reservation
- Order Service: orders, cart, checkout
- Payment Service: payment processing
- Notification Service: event-driven notifications

### API Gateway
- Spring Cloud Gateway for routing
- JWT validation in GlobalFilter
- CORS configuration
- Route definitions: `/api/auth/**` → User Service, `/api/products/**` → Product Service, etc.

### REST vs Kafka
- REST: Synchronous operations requiring immediate response (product search, cart updates, user auth)
- Kafka: Asynchronous events (order created → inventory reservation, payment completion → notification)

### Database-per-Service
- 6 separate MySQL databases: ecommerce_user, ecommerce_product, ecommerce_inventory, ecommerce_order, ecommerce_payment, ecommerce_notification
- No cross-service database access

### Eventual Consistency
- Order Service publishes ORDER_CREATED → Inventory reserves stock asynchronously
- If inventory reservation fails, INVENTORY_RELEASED event triggers rollback
- Payment success/failure events update order status asynchronously

---

## Kafka

### Producer
- `OrderEventProducer`: publishes ORDER_CREATED, ORDER_CANCELLED, ORDER_STATUS events
- `PaymentEventProducer`: publishes PAYMENT_COMPLETED, PAYMENT_FAILED events
- `InventoryEventProducer`: publishes INVENTORY_RESERVED, INVENTORY_RELEASED events

### Consumer
- `OrderEventConsumer` (Inventory Service): handles ORDER_CREATED → reserve stock
- `PaymentEventConsumer` (Order Service): handles PAYMENT_COMPLETED → confirm order
- `EventConsumer` (Notification Service): handles all events → create notifications

### Topic Design
- `order-events`: order lifecycle events
- `inventory-events`: stock change events
- `payment-events`: payment result events

### Error Handling
- try-catch in consumers with logging
- Failed inventory reservation triggers INVENTORY_RELEASED event
- Failed payment triggers order status update to FAILED

### Idempotency
- Payment processing checks for existing completed payment before processing
- Order status transitions are validated to prevent invalid state changes

### Why Async Events?
Decouples services — Order Service doesn't need to know about Notification Service. If Notification Service is down, events persist in Kafka and are processed when it comes back.

---

## E-Commerce

### How does checkout work?
1. Validate cart items and quantities
2. Create order with PENDING status
3. Calculate subtotal, tax (18% GST), shipping (free > $100)
4. Save order + order items (product snapshot)
5. Publish ORDER_CREATED events for each item
6. Inventory Service reserves stock
7. Customer selects payment method
8. Payment Service processes payment
9. On success: Order → CONFIRMED, Notification sent
10. On failure: Order → FAILED, Inventory released

### What happens if payment fails?
PaymentFailedEvent is published → Order Service marks order as FAILED → Inventory Service releases reserved stock → Notification Service alerts customer.

### How are order states controlled?
`isValidTransition()` method enforces valid transitions:
- PENDING → CONFIRMED or CANCELLED
- CONFIRMED → PROCESSING or CANCELLED
- PROCESSING → SHIPPED or CANCELLED
- SHIPPED → OUT_FOR_DELIVERY
- OUT_FOR_DELIVERY → DELIVERED
Invalid transitions throw OrderStateException.

---

## Angular

### Components
- Standalone components (Angular 17 pattern)
- Shared components: NavbarComponent, FooterComponent
- Lazy-loaded routes with loadComponent

### Services
- AuthService: JWT management, login/logout, role checking
- ProductService: API calls for products/categories
- CartService: cart operations with BehaviorSubject
- OrderService, PaymentService, NotificationService

### Routing & Guards
- authGuard: checks isLoggedIn()
- adminGuard: checks isLoggedIn() && isAdmin()
- customerGuard: checks isLoggedIn() && isCustomer()
- Lazy-loaded route configuration

### Interceptors
- authInterceptor: attaches Bearer token to all HTTP requests

### Reactive Forms
- FormsModule with ngModel for simple forms
- Form validation with required attributes

---

## Security

### JWT Flow
1. User registers → BCrypt password hash → JWT token generated
2. User logs in → credentials validated → JWT returned
3. Frontend stores JWT in localStorage
4. AuthInterceptor attaches Bearer token to all requests
5. API Gateway validates JWT, extracts user info, forwards to service

### Role-Based Authorization
- CUSTOMER: browse products, manage cart, place orders
- ADMIN: manage products, inventory, orders, payments
- Admin endpoints protected by adminGuard (frontend) + Gateway filtering (backend)

---

## Docker

### Dockerfile
Multi-stage build: Maven build stage → JRE runtime stage

### Docker Compose
- MySQL with health check
- Kafka + Zookeeper
- 6 backend services with dependency ordering
- Environment variables for configuration

---

## Testing

### Unit Tests
- @ExtendWith(MockitoExtension.class)
- @Mock for dependencies, @InjectMocks for service under test
- Verify mock interactions, assert responses

### Controller Tests
- @WebMvcTest with MockMvc
- @MockBean for service layer
- Test status codes, JSON responses, validation

### Integration Tests
- Test full flow: create order → reserve inventory → process payment
