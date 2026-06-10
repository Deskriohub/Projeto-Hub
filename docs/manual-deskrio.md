# Manual Completo — Central de Gestão DeskRio

Este documento descreve, em detalhes, todas as funcionalidades da plataforma Central de Gestão DeskRio. Use-o para responder qualquer dúvida sobre como usar a plataforma.

## Visão geral e perfis de acesso

A Central de Gestão DeskRio é a plataforma interna da empresa para gestão de pessoas, comunicação e acompanhamento.

Existem dois perfis principais:
- **Usuário (geral)**: acesso às funcionalidades do dia a dia (Home, elogios, feedbacks, suas reuniões, avisos, eventos, sugestões, Deskinho, ajuda).
- **Admin**: tudo do usuário, mais a área de Administração (Usuários, Sugestões, Configurações, Base de Conhecimento) e a gestão completa de One-on-One, Avisos e Relatórios.

O perfil de cada pessoa é definido por um admin na tela de Usuários. A área "Administração" só aparece no menu para quem é admin.

## Home (Painel Principal)

Ao entrar, o usuário cai na Home. Ela mostra:
- Saudação com o primeiro nome.
- Cards de Missão, Visão e Valores da empresa.
- **Mural de Avisos**: os comunicados da empresa direcionados àquele usuário.
- **Mural de Elogios**: reconhecimentos recentes (abas Recebidos / Todos), com a foto de quem enviou e de quem recebeu.
- **Calendário do mês**.

### Calendário
Mostra tudo que tem data:
- Eventos (cores variadas).
- Avisos com data de início (em amarelo, ícone 📢).
- Reuniões One-on-One (em azul, ícone 👥, com a hora).

Navegação: setas ← → trocam de mês. Clicar num dia abre o painel do dia com os compromissos. Clicar num evento abre o evento com todas as informações para ver ou editar. Passar o mouse num dia e clicar no "+" cria um evento naquele dia.

## Notificações (o sino 🔔)

No topo da tela, ao lado da foto, há um sino. Um número vermelho mostra quantas notificações não foram lidas. Ao clicar, abre a lista; clicar numa notificação leva direto ao item. Há um botão "Marcar todas" para zerar as não lidas. Abaixo, aparecem os próximos compromissos dos próximos 7 dias.

O usuário recebe notificação quando:
- Alguém responde uma sugestão dele.
- Recebe um feedback.
- Um aviso é direcionado a ele.
- É marcado num evento, ou um 1:1 é agendado/remarcado com ele.
- Um aviso criado por ele atinge a data de fim (expira).

## Mural de Elogios

Espaço para reconhecer colegas publicamente.

Para dar um elogio:
1. Acessar "Mural de Elogios" e clicar em "Novo Elogio".
2. Escolher um emoji, selecionar o colega e escrever a mensagem.
3. Marcar "Público" (todos veem) ou deixar privado.
4. Enviar.

Cada card mostra a foto de quem enviou e de quem recebeu. Clicar no card abre com as fotos maiores e a mensagem completa. É possível reagir a elogios de outros com emojis. Quem enviou, quem recebeu ou um admin pode excluir um elogio.

## Feedbacks

Feedbacks são mensagens privadas entre colegas — somente quem envia e quem recebe (e admins) conseguem ver. Há três tipos: Positivo (verde), Construtivo (laranja) e Negativo (vermelho).

Para dar um feedback:
1. Acessar "Feedbacks" e clicar em "Dar Feedback".
2. No campo "Para", selecionar uma OU várias pessoas (por exemplo, o time todo).
3. Escolher o tipo (Positivo, Construtivo, Negativo).
4. Escrever o conteúdo e enviar.

Quando várias pessoas são selecionadas, cada uma recebe o feedback e a notificação individualmente. As abas "Recebidos" e "Enviados" mostram o histórico; admin também vê a aba "Todos".

### Feedback Pós-1:1
Após uma reunião, o participante pode abrir o 1:1 em "Minhas Reuniões" → "Visualizar one-on-one" e clicar em "Feedback Pós-1:1". O destinatário já vem preenchido com o outro participante da reunião.

## Eventos

Eventos podem ser criados na página "Eventos" (menu Recursos) ou clicando num dia do calendário.

Campos ao criar um evento:
1. Título (obrigatório).
2. Data início e Data fim (a data fim é opcional, para eventos de vários dias).
3. Hora início e Hora fim. Se deixar a hora em branco, é um evento de dia inteiro.
4. Descrição (opcional).
5. Visibilidade: "Mostrar no calendário" (todos veem) ou "Só para mim" (lembrete pessoal, ninguém mais vê).
6. "Marcar pessoas": as pessoas marcadas recebem uma notificação e o evento aparece no calendário delas.

### Repetir todo mês (recorrência)
Ao criar, marcar "Repetir todo mês" e escolher por quantos meses (de 2 a 12). O sistema cria um evento por mês, na mesma data e hora. Cada ocorrência é um registro independente — dá para editar a data e a hora de um mês específico sem afetar os outros.

### Página Eventos
Lista todos os eventos agrupados por mês. Cada evento é clicável: abre com as informações e permite editar ou excluir. O que é criado aqui aparece automaticamente no calendário da Home.

Qualquer pessoa pode criar eventos e lembretes pessoais.

## One-on-One (Reuniões 1:1)

One-on-One são reuniões individuais entre um gestor (líder) e um liderado, para alinhamento, desenvolvimento e acompanhamento.

O menu se adapta ao perfil:
- **Usuário (liderado)**: vê apenas "Minhas reuniões".
- **Admin (líder)**: vê apenas "Todas as reuniões" — pois o líder acompanha os liderados e não tem 1:1 próprio.

### Minhas reuniões (liderado)
Lista os 1:1 do usuário. Cada card mostra a data, a hora e os próximos passos. O liderado marca como concluídos os próximos passos sob a responsabilidade dele.

### Próximos Passos (o que são)
São os combinados que saem da reunião — o que cada um vai fazer até o próximo encontro. Cada item tem um Responsável: "Líder" (gestor) ou "Liderado". Quem é o responsável marca o item como concluído depois, e fica registrado quem concluiu e quando. Podem ser preenchidos durante ou depois da reunião. Ao apenas agendar, podem ficar vazios.

### Todas as reuniões (admin/líder)
Mostra todos os 1:1 dos liderados. Cada card é um 1:1 de um liderado; cards amarelos têm próximos passos pendentes. No topo, um cartão indica quantos liderados têm itens em aberto e, ao ser clicado, filtra só esses. Há filtros por Liderado, Mês/Ano e Pendências. "Ver próximos passos" expande os itens, mostrando o responsável e o que já foi concluído.

### Criar um One-on-One (admin)
1. Em "Todas as reuniões", clicar em "Novo One-on-One".
2. Escolher o liderado, a data e a hora.
3. Escrever as anotações da reunião (com formatação e emojis).
4. Adicionar os Próximos Passos, definindo o responsável de cada um.
5. Opcional: marcar "Repetir todo mês" para criar vários encontros mensais de uma vez.
6. Salvar. O liderado recebe notificação do agendamento e de eventuais remarcações (mudança de data/hora).

### Agendar para o time todo (admin)
Em "Todas as reuniões", o botão "Agendar para o time" abre um quadro onde se adiciona várias pessoas, cada uma com sua data e hora. O botão "Adicionar time todo" preenche todos os colaboradores de uma vez. Há opção de repetir mensalmente. Ao confirmar, cria todos os 1:1 de uma vez e notifica cada pessoa individualmente.

## Avisos

Avisos são comunicados da empresa, exibidos no Mural de Avisos da Home.

Criar um aviso (admin):
1. Em "Avisos", clicar em "Novo Aviso".
2. Preencher Título, Observação e Link (os dois últimos opcionais).
3. Início (opcional): a partir de quando o aviso aparece — e ele é marcado no calendário nessa data. Fim (opcional): quando o aviso some automaticamente. Sem datas, fica sempre visível.
4. "Enviar para": "Todos" ou "Pessoas específicas". Com pessoas específicas, só os destinatários veem o aviso no mural e no calendário, e são notificados. Isso permite separar times (por exemplo, N1, N2, administradores).
5. Publicar.

O criador sempre vê o próprio aviso no mural. Quando um aviso atinge a data de fim, quem o criou é notificado de que ele saiu do mural.

## Sugestões

Canal para enviar ideias e melhorias.

O usuário acessa "Minhas Sugestões", clica em "Nova sugestão" e escreve a ideia. Pode marcar como anônima — nesse caso a sugestão não fica vinculada ao perfil (nem o autor a vê depois em Minhas Sugestões). Quando a equipe responde, o autor recebe uma notificação e a resposta aparece no card da sugestão. O usuário pode excluir as próprias sugestões.

O admin acessa "Sugestões" (Administração), vê todas, responde (a resposta chega ao autor) e pode excluir.

## Deskinho (Assistente Virtual)

O Deskinho é o assistente virtual da DeskRio, funcionando como um assistente de IA completo. Ele responde:
- Dúvidas sobre como usar a plataforma.
- Dúvidas sobre processos e informações da empresa.
- Perguntas de clientes que os funcionários precisam responder.
- Questões gerais de trabalho, redação de textos, e-mails, etc.

O Deskinho aprende com os materiais que o admin sobe na Base de Conhecimento. Para usar: acessar "Deskinho" no menu, digitar a pergunta e enviar. Ele responde em tempo real e mantém o contexto da conversa. O botão "Limpar" começa uma conversa nova.

## Usuários (Admin)

Em "Usuários", o admin vê todos os cadastrados e pode:
- Alterar o perfil de cada pessoa (Admin ou Usuário).
- Subir a foto de qualquer pessoa: passar o mouse no avatar da coluna Foto e clicar (imagens até 5MB).

Novos usuários se cadastram pelo login; depois o admin define o perfil.

## Base de Conhecimento da IA (Admin)

Em Configurações → "Base de Conhecimento da IA", o admin alimenta o Deskinho com materiais da empresa.

Clicar em "Enviar documento". Aceita PDF, Word (.docx), PowerPoint (.pptx), imagens (PNG/JPG) e texto (.txt, .md). PDFs com imagem e prints são lidos automaticamente por OCR (IA de visão). O sistema extrai o conteúdo, guarda o arquivo para download e o Deskinho passa a usar esse conteúdo nas respostas. Quanto mais materiais, mais o Deskinho sabe.

## Configurações

Disponível para todos:
- Foto de perfil: "Alterar foto" (JPG, PNG ou WebP, até 5MB).
- Alterar senha: nova senha com no mínimo 6 caracteres.

Para admin, também:
- Acesso à Base de Conhecimento da IA.
- **Auditoria**: registro das últimas 100 ações realizadas na plataforma (feedbacks, respostas a sugestões, eventos, avisos, fotos, mudanças de perfil, etc.). Cada registro é clicável e mostra o histórico de Antes e Depois da mudança. A auditoria registra apenas ações feitas pelos usuários na interface, não mudanças diretas no banco de dados.

## Relatórios (Admin)

Exibe dashboards do Power BI integrados à plataforma. Novos relatórios são configurados pelo time de TI/admin.

## Ajuda

A "Central de Ajuda" (menu Recursos) traz este guia de funcionalidades organizado por seção, com passo a passo, adaptado ao perfil de quem acessa.
