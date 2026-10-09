-- Known local-development credential: admin@shophub.local / password
UPDATE admin_users
SET password = '$2y$10$z5e7z.HqP.FXw8hxr7GAt.gwBh51t78FiuE6Ie3mC2Jfm6g/Y.9AS'
WHERE email = 'admin@shophub.local';
