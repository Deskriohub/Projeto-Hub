-- Enforce, no servidor, que apenas e-mails @deskrio.com.br possam ser criados.
-- Complementa a checagem feita no client (AuthContext), impedindo bypass via API direta.
CREATE OR REPLACE FUNCTION public.enforce_deskrio_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.email IS NULL OR lower(split_part(NEW.email, '@', 2)) <> 'deskrio.com.br' THEN
    RAISE EXCEPTION 'Acesso restrito a e-mails @deskrio.com.br';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_deskrio_email_trigger ON auth.users;
CREATE TRIGGER enforce_deskrio_email_trigger
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.enforce_deskrio_email();
