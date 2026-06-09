CREATE POLICY "Liderado can toggle own todos"
ON public.one_on_one_todos
FOR UPDATE
TO authenticated
USING (
  responsavel = 'Liderado' AND EXISTS (
    SELECT 1 FROM public.one_on_one o
    WHERE o.id = one_on_one_todos.one_on_one_id
      AND o.liderado_id = auth.uid()
  )
)
WITH CHECK (
  responsavel = 'Liderado' AND EXISTS (
    SELECT 1 FROM public.one_on_one o
    WHERE o.id = one_on_one_todos.one_on_one_id
      AND o.liderado_id = auth.uid()
  )
);