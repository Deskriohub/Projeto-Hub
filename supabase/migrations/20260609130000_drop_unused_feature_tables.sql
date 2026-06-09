-- Remove as tabelas das features cortadas do produto (Avaliações, Levels,
-- Premiação e Competências). Nenhuma tela do app usa essas tabelas e nenhuma
-- tabela mantida possui FK apontando para elas. CASCADE remove as policies,
-- triggers, índices e constraints dependentes dessas tabelas.
DROP TABLE IF EXISTS
  public.evaluation_competency_results,
  public.evaluation_competency_recommendations,
  public.evaluation_promotion_approvals,
  public.evaluation_responses,
  public.evaluation_rounds,
  public.evaluations,
  public.evaluation_cycles,
  public.behaviors,
  public.competencies,
  public.levels,
  public.level_tracks,
  public.premiacao_snapshots,
  public.premiacao_faixas
CASCADE;

-- Funções auxiliares exclusivas do módulo de Avaliações (sem mais uso).
-- update_updated_at_column NÃO é removida: é genérica e usada pelas tabelas mantidas.
DROP FUNCTION IF EXISTS public.can_view_evaluation(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_edit_evaluation(uuid) CASCADE;
