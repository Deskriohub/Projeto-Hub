ALTER TABLE public.evaluation_competency_results DROP COLUMN IF EXISTS comment;
ALTER TABLE public.evaluations DROP COLUMN IF EXISTS manager_comments;
ALTER TABLE public.evaluation_competency_syntheses RENAME COLUMN synthesis TO recommendations;
ALTER TABLE public.evaluation_competency_syntheses RENAME TO evaluation_competency_recommendations;