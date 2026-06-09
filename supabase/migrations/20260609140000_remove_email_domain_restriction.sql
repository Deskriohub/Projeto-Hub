-- Remove a restrição de domínio @deskrio.com.br pois a plataforma
-- aceita funcionários com e-mails externos (gmail, etc.).
-- O controle de acesso é feito pelo admin ao criar os usuários manualmente.
DROP TRIGGER IF EXISTS enforce_deskrio_email_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.enforce_deskrio_email();
