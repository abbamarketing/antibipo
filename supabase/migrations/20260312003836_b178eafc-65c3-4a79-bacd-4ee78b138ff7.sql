REVOKE ALL ON FUNCTION public.reset_user_data(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.reset_my_data() FROM anon;
GRANT EXECUTE ON FUNCTION public.reset_user_data(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reset_my_data() TO authenticated, service_role;