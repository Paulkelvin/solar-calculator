-- ============================================================
-- CLEAR ALL DATA & USER ACCOUNTS
-- Run this in Supabase SQL Editor to wipe everything clean
-- ============================================================

-- 1. Delete all application data (order matters due to foreign keys)
DELETE FROM activity_log;
DELETE FROM leads;
DELETE FROM installers;

-- 2. Delete all user accounts from Supabase Auth
-- This removes ALL users from auth.users (they will need to re-register)
DELETE FROM auth.users;

-- 3. Verify everything is empty
SELECT 'leads' AS table_name, COUNT(*) AS row_count FROM leads
UNION ALL
SELECT 'activity_log', COUNT(*) FROM activity_log
UNION ALL
SELECT 'installers', COUNT(*) FROM installers
UNION ALL
SELECT 'auth.users', COUNT(*) FROM auth.users;
