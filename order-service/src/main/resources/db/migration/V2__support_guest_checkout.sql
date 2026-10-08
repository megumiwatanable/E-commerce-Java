ALTER TABLE orders MODIFY customer_id BIGINT NULL;
ALTER TABLE orders ADD COLUMN guest_email VARCHAR(255) NULL AFTER customer_id;
ALTER TABLE orders ADD COLUMN guest_phone VARCHAR(30) NULL AFTER guest_email;
CREATE INDEX idx_orders_guest_email ON orders (guest_email);
