# Migrations pendentes (NÃO rodam automaticamente)

Os arquivos `.sql` desta pasta **não** ficam em `supabase/migrations/`, então **não**
são aplicados por `supabase db push` / deploy. São passos manuais que dependem de
uma confirmação explícita antes de rodar.

## `20260701000000_drop_one_on_one_anotacoes.sql`

Remove a coluna legada `public.one_on_one.anotacoes`.

Hoje (após `20260624120000_anotacoes_livres.sql`) essa coluna virou **backup
congelado**: o app não escreve mais nela, todo o conteúdo foi copiado para a
tabela `public.anotacoes`. Só rode o drop **depois de confirmar** que:

1. A tela "Anotações" e o 1:1 estão lendo/gravando na tabela `anotacoes`.
2. A contagem bate (rode a conferência abaixo — origem deve ser ≤ migradas):

   ```sql
   SELECT
     (SELECT count(*) FROM public.one_on_one WHERE anotacoes IS NOT NULL AND btrim(anotacoes) <> '') AS origem,
     (SELECT count(*) FROM public.anotacoes WHERE one_on_one_id IS NOT NULL)                          AS migradas;
   ```

### Como aplicar (quando autorizado)

Mova o arquivo para `supabase/migrations/` e rode o deploy normal, **ou** cole o
SQL direto no SQL Editor do Supabase.
