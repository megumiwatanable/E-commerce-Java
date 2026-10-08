ALTER TABLE carts ADD COLUMN billing_address TEXT NULL AFTER customer_id;
ALTER TABLE orders ADD COLUMN billing_address TEXT NULL AFTER shipping_address;
