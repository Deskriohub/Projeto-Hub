-- Update evaluations status check to remove 'cancelada' (after clearing any rows in that state)
UPDATE public.evaluations SET status = 'draft' WHERE status = 'cancelada';
ALTER TABLE public.evaluations DROP CONSTRAINT IF EXISTS evaluations_status_check;
ALTER TABLE public.evaluations ADD CONSTRAINT evaluations_status_check CHECK (status = ANY (ARRAY['draft'::text, 'awaiting_meeting'::text, 'published'::text]));

-- Allow the evaluator (gestor) to delete their own non-published evaluations
CREATE POLICY "Gestor can delete own non-published evaluations"
ON public.evaluations
FOR DELETE
TO authenticated
USING (
  evaluator_id = auth.uid()
  AND status <> 'published'
  AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'gestor'::app_role)
);