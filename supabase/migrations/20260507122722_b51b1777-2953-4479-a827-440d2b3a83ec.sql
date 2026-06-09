-- 1) Allow liderado to read their one_on_one_todos
DROP POLICY IF EXISTS "Todos visible via one_on_one access" ON public.one_on_one_todos;
CREATE POLICY "Todos visible via one_on_one access"
ON public.one_on_one_todos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.one_on_one o
    WHERE o.id = one_on_one_todos.one_on_one_id
      AND (
        o.gestor_id = auth.uid()
        OR o.liderado_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'::app_role
        )
      )
  )
);

-- 2) Remove broad listing on configuracoes bucket.
-- Public direct-URL reads still work because the bucket is marked public.
DROP POLICY IF EXISTS "Public can read configuracoes bucket" ON storage.objects;