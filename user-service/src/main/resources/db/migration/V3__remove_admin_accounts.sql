-- Administrator identities now live exclusively in ecommerce_admin.admin_users.
DELETE FROM users WHERE role = 'ADMIN';
