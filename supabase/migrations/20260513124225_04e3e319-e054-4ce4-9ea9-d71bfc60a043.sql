
REVOKE EXECUTE ON FUNCTION public.can_view_evaluation(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_edit_evaluation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_evaluation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_evaluation(uuid) TO authenticated;
