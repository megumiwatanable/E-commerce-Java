ALTER TABLE orders
    ADD COLUMN checkout_token VARCHAR(64) NULL AFTER guest_phone,
    ADD COLUMN idempotency_key VARCHAR(64) NULL AFTER checkout_token;

CREATE UNIQUE INDEX uk_orders_checkout_token ON orders (checkout_token);
CREATE UNIQUE INDEX uk_orders_idempotency_key ON orders (idempotency_key);
