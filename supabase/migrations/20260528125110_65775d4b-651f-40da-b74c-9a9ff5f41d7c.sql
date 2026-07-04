
DROP POLICY IF EXISTS "public read product-images" ON storage.objects;
-- Public bucket still serves files via /storage/v1/object/public/ which bypasses RLS.

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
