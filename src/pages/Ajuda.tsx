import { HelpCircle, Home, Smile, MessageCircle, CalendarRange, Lightbulb, Bot, Megaphone, BarChart3, Users, Settings, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { useUserRole } from "@/hooks/useUserRole";

interface Section {
  id: string;
  icon: React.ElementType;
  title: string;
  badge?: string;
  content: { subtitle: string; steps: string[] }[];
}

const SECTIONS: Section[] = [
  {
    id: "inicio",
    icon: Home,
    title: "Home — Painel Principal",
    content: [
      {
        subtitle: "O que você vê na Home",
        steps: [
          "Ao entrar na plataforma, você é levado direto para a Home.",
          "No topo aparece uma saudação com o seu nome.",
          "Abaixo há o calendário do mês mostrando tudo que tem data: eventos, avisos e reuniões One-on-One.",
          "Também aparecem os avisos mais recentes da empresa.",
        ],
      },
      {
        subtitle: "O que aparece no Calendário",
        steps: [
          "📅 Eventos criados manualmente — aparecem em cores variadas.",
          "📢 Avisos com data — aparecem em amarelo (amber).",
          "👥 Reuniões One-on-One — aparecem em azul (índigo).",
          "Clique nas setas ← → para mudar de mês.",
          "Clique em um dia para ver todos os compromissos daquele dia no painel abaixo.",
        ],
      },
      {
        subtitle: "Criando um evento ou lembrete",
        steps: [
          "1. No calendário, passe o mouse sobre um dia e clique no botão + (ou clique no dia e em 'Novo evento').",
          "2. Preencha o título, data e, se quiser, hora e descrição.",
          "3. Em 'Visibilidade', escolha: '📅 Mostrar no calendário' (todos veem) ou '🔒 Só para mim' (lembrete pessoal).",
          "4. Use 'Só para mim' para criar lembretes pessoais das suas atividades — só você verá.",
          "5. Clique em 'Criar evento'.",
          "Qualquer pessoa (admin ou usuário) pode criar eventos e lembretes pessoais.",
        ],
      },
      {
        subtitle: "Notificações na tela 🔔",
        steps: [
          "No topo da tela, ao lado da sua foto, há um sino de notificações.",
          "Ele mostra os próximos compromissos dos próximos 7 dias: eventos, avisos e reuniões.",
          "Quando há compromissos para hoje, aparece um número vermelho no sino.",
          "Ao entrar na plataforma, um aviso aparece na tela lembrando os compromissos do dia.",
          "Clique em um item do sino para ir direto até ele.",
        ],
      },
    ],
  },
  {
    id: "mural",
    icon: Smile,
    title: "Mural de Elogios",
    content: [
      {
        subtitle: "O que é o Mural de Elogios",
        steps: [
          "O Mural de Elogios é um espaço para reconhecer publicamente um colega de trabalho.",
          "Todos os funcionários podem dar e visualizar elogios.",
          "Os elogios ficam visíveis para toda a equipe no mural.",
        ],
      },
      {
        subtitle: "Como dar um elogio",
        steps: [
          "1. Clique no botão 'Dar Elogio' no canto superior direito.",
          "2. Escolha um emoji que represente o reconhecimento (ex: 🌟, 🚀, 💪).",
          "3. No campo 'Para quem?', selecione o colega que você quer elogiar.",
          "4. Escreva sua mensagem no campo de texto.",
          "5. Marque 'Público' se quiser que todos vejam, ou deixe privado.",
          "6. Clique em 'Enviar Elogio'.",
        ],
      },
      {
        subtitle: "Como reagir a um elogio",
        steps: [
          "No mural, cada elogio tem botões de reação com emojis.",
          "Clique em um emoji para reagir ao elogio.",
          "Você pode remover sua reação clicando no mesmo emoji novamente.",
        ],
      },
    ],
  },
  {
    id: "feedbacks",
    icon: MessageCircle,
    title: "Feedbacks",
    content: [
      {
        subtitle: "O que são os Feedbacks",
        steps: [
          "Feedbacks são mensagens privadas entre você e um colega.",
          "Diferente dos elogios (públicos), os feedbacks são visíveis apenas para quem enviou e quem recebeu.",
          "Existem três tipos: Positivo (verde), Construtivo (laranja) e Negativo (vermelho).",
          "Use feedbacks para comunicar reconhecimentos, sugestões de melhoria ou situações que precisam de atenção.",
        ],
      },
      {
        subtitle: "Como dar um feedback",
        steps: [
          "1. Acesse 'Feedbacks' no menu lateral.",
          "2. Clique no botão 'Dar Feedback'.",
          "3. Escolha o tipo: Positivo, Construtivo ou Negativo.",
          "4. No campo 'Para quem?', selecione o colega.",
          "5. Escreva o conteúdo do feedback.",
          "6. Clique em 'Enviar Feedback'.",
        ],
      },
      {
        subtitle: "Visualizando seus feedbacks",
        steps: [
          "A aba 'Recebidos' mostra todos os feedbacks que outras pessoas enviaram para você.",
          "A aba 'Enviados' mostra os feedbacks que você deu para outros.",
          "Clique em qualquer feedback para ver o conteúdo completo.",
        ],
      },
      {
        subtitle: "Feedback Pós-One-on-One",
        steps: [
          "Após uma reunião One-on-One, você pode dar um feedback diretamente pela tela da reunião.",
          "1. Vá em 'One-on-One' → 'Minhas Reuniões'.",
          "2. Clique em 'Visualizar' na reunião desejada.",
          "3. No canto superior direito, clique em 'Feedback Pós-1:1'.",
          "4. O campo 'Para quem?' já será preenchido automaticamente com o outro participante.",
          "5. Escolha o tipo e escreva o feedback.",
        ],
      },
    ],
  },
  {
    id: "oneonone",
    icon: CalendarRange,
    title: "One-on-One (Reuniões 1:1)",
    content: [
      {
        subtitle: "O que é o One-on-One",
        steps: [
          "One-on-One é uma reunião individual entre um gestor e um liderado.",
          "Serve para alinhar expectativas, discutir desenvolvimento, pontos de melhoria e acompanhar metas.",
          "A plataforma registra as anotações, tarefas e comentários de cada reunião.",
        ],
      },
      {
        subtitle: "Minhas Reuniões — para todos",
        steps: [
          "1. Acesse 'One-on-One' → 'Minhas Reuniões' no menu lateral.",
          "2. Você verá a lista de todas as reuniões em que você participa (como gestor ou como liderado).",
          "3. Clique em 'Visualizar' para abrir os detalhes de uma reunião.",
          "4. Na tela de detalhes você verá: data, anotações do gestor, próximos passos e comentários.",
        ],
      },
      {
        subtitle: "Próximos Passos (To-dos da reunião)",
        steps: [
          "Próximos Passos são tarefas definidas durante a reunião.",
          "Cada tarefa tem um responsável: 'Líder' (gestor) ou 'Liderado'.",
          "Se você é o liderado, pode marcar suas tarefas como concluídas diretamente na tela da reunião.",
          "As tarefas concluídas ficam registradas com data e hora de conclusão.",
        ],
      },
      {
        subtitle: "Todas as Reuniões — apenas Admin",
        steps: [
          "Admins acessam 'One-on-One' → 'Todas as Reuniões' para visualizar e criar novas reuniões.",
          "Para criar uma reunião: clique em 'Nova Reunião', selecione o liderado, defina a data e adicione anotações e tarefas.",
          "As reuniões criadas aparecem no calendário da Home automaticamente.",
        ],
      },
    ],
  },
  {
    id: "sugestoes",
    icon: Lightbulb,
    title: "Sugestões",
    content: [
      {
        subtitle: "O que são as Sugestões",
        steps: [
          "O canal de sugestões permite que qualquer funcionário envie ideias ou críticas construtivas para a empresa.",
          "A sugestão pode ser anônima (seu nome não aparece) ou identificada (seu nome é mostrado).",
        ],
      },
      {
        subtitle: "Como enviar uma sugestão",
        steps: [
          "1. Acesse 'Sugestões' — se não aparecer no menu, fale com o admin pois pode ser que só admins vejam a lista, mas há um botão na Home.",
          "2. Clique em 'Nova Sugestão'.",
          "3. Escreva sua ideia ou sugestão no campo de texto.",
          "4. Marque 'Enviar de forma anônima' se não quiser se identificar.",
          "5. Clique em 'Enviar'.",
        ],
      },
      {
        subtitle: "Resposta às sugestões — Admin",
        steps: [
          "Admins visualizam todas as sugestões na tela de Sugestões.",
          "Clique em uma sugestão para abrir o painel de resposta.",
          "Escreva a resposta ou devolutiva no campo indicado e clique em 'Salvar resposta'.",
          "Para excluir uma sugestão (quando necessário), clique no botão vermelho 'Excluir'.",
        ],
      },
    ],
  },
  {
    id: "deskinho",
    icon: Bot,
    title: "Deskinho — Assistente Virtual",
    content: [
      {
        subtitle: "O que é o Deskinho",
        steps: [
          "O Deskinho é o assistente virtual inteligente da DeskRio.",
          "Funciona como um ChatGPT interno da empresa — você pode perguntar qualquer coisa.",
          "Ele conhece os processos e informações da empresa configuradas pelo admin.",
          "Também tem acesso ao manual da plataforma e pode explicar qualquer funcionalidade.",
        ],
      },
      {
        subtitle: "O que você pode perguntar",
        steps: [
          "Dúvidas sobre como usar a plataforma: 'Como dar um feedback?', 'Onde fica o calendário?'",
          "Dúvidas gerais de trabalho: 'Como escrever um e-mail profissional?', 'Como dar um feedback difícil?'",
          "Perguntas de clientes que você precisa responder.",
          "Qualquer outra questão — o Deskinho é um assistente geral.",
        ],
      },
      {
        subtitle: "Como usar o Deskinho",
        steps: [
          "1. Acesse 'Deskinho' no menu lateral (seção Recursos).",
          "2. Digite sua pergunta no campo de texto na parte de baixo.",
          "3. Pressione Enter ou clique no botão de enviar.",
          "4. O Deskinho responde em tempo real, palavra por palavra.",
          "5. Você pode continuar a conversa fazendo perguntas de acompanhamento.",
          "6. Para começar uma nova conversa do zero, clique em 'Limpar' no canto superior direito.",
        ],
      },
    ],
  },
  {
    id: "avisos",
    icon: Megaphone,
    title: "Avisos",
    content: [
      {
        subtitle: "O que são os Avisos",
        steps: [
          "Avisos são comunicados importantes da empresa para todos os funcionários.",
          "Aparecem na Home e na página de Avisos.",
          "Podem ter um link para mais informações.",
        ],
      },
      {
        subtitle: "Gerenciando Avisos — Admin",
        steps: [
          "1. Acesse 'Avisos' no menu lateral.",
          "2. Clique no botão 'Novo Aviso' — abre uma janela para preencher.",
          "3. Preencha o título, observação (opcional) e link (opcional).",
          "4. Em 'Data (opcional)', defina uma data para o aviso aparecer no calendário da Home.",
          "5. Em 'Visível para', escolha 'Todos os usuários' ou 'Somente admins'.",
          "6. Clique em 'Publicar aviso'. Você pode criar quantos avisos quiser.",
          "7. Para excluir um aviso, clique no ícone de lixeira ao lado dele.",
        ],
      },
    ],
  },
  {
    id: "relatorios",
    icon: BarChart3,
    title: "Relatórios",
    content: [
      {
        subtitle: "O que são os Relatórios",
        steps: [
          "A seção de Relatórios exibe dashboards do Power BI integrados à plataforma.",
          "Permite visualizar indicadores e métricas da empresa diretamente na Central de Gestão.",
          "Novos relatórios são configurados pelo time de TI/admin.",
        ],
      },
    ],
  },
];

const ADMIN_SECTIONS: Section[] = [
  {
    id: "usuarios",
    icon: Users,
    title: "Usuários",
    badge: "Admin",
    content: [
      {
        subtitle: "Gerenciando usuários",
        steps: [
          "1. Acesse 'Usuários' no menu de Administração.",
          "2. Você verá a lista de todos os usuários cadastrados com nome, e-mail e perfil.",
          "3. Para alterar o perfil de um usuário, clique no seletor de perfil ao lado do nome.",
          "4. Os perfis disponíveis são: Admin (acesso total), Gestor (acesso intermediário) e Usuário (acesso básico).",
          "5. Para criar um novo usuário, ele precisa fazer o cadastro pelo link de login — após criar a conta, o admin define o perfil.",
        ],
      },
    ],
  },
  {
    id: "configuracoes",
    icon: Settings,
    title: "Configurações",
    badge: "Admin",
    content: [
      {
        subtitle: "Foto de perfil (todos)",
        steps: [
          "1. Acesse 'Configurações' no menu de Administração.",
          "2. Na seção 'Foto de perfil', clique em 'Alterar foto'.",
          "3. Selecione uma imagem no seu computador (JPG, PNG ou WebP, máximo 2MB).",
          "4. A foto é atualizada automaticamente e aparece no cabeçalho e perfil.",
        ],
      },
      {
        subtitle: "Alterar senha (todos)",
        steps: [
          "1. Na seção 'Alterar senha', preencha a nova senha (mínimo 6 caracteres).",
          "2. Confirme a senha no segundo campo.",
          "3. Clique em 'Alterar senha'.",
        ],
      },
      {
        subtitle: "Contexto da IA — Admin",
        steps: [
          "O 'Contexto da IA' é um texto que você escreve para ensinar o Deskinho sobre a empresa.",
          "Use para informar: políticas internas, processos, perguntas frequentes de clientes, missão e valores.",
          "Exemplo: 'Nossa empresa oferece serviços de atendimento ao cliente. O horário de funcionamento é das 8h às 18h...'",
          "1. Na seção 'Contexto da IA', escreva as informações no campo de texto.",
          "2. Clique em 'Salvar contexto'.",
          "3. O Deskinho passará a usar esse conteúdo em todas as respostas.",
        ],
      },
      {
        subtitle: "Auditoria — Admin",
        steps: [
          "A seção Auditoria registra as últimas 100 ações realizadas na plataforma.",
          "Mostra: data/hora, usuário, módulo e descrição da ação.",
          "Ações registradas incluem: dar feedbacks, responder sugestões, criar eventos, alterar senhas, fazer upload de foto, etc.",
          "Não registra ações no banco de dados — apenas ações feitas pelos usuários na interface.",
          "Clique em 'Atualizar' para carregar as ações mais recentes.",
        ],
      },
    ],
  },
];

export default function Ajuda() {
  const { role } = useUserRole();
  const isAdmin = role === "admin";

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <HelpCircle className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Central de Ajuda</h1>
          <p className="text-sm text-muted-foreground">Guia completo de todas as funcionalidades da plataforma.</p>
        </div>
      </div>

      <Accordion type="multiple" className="space-y-2">
        {SECTIONS.map((section) => (
          <AccordionItem
            key={section.id}
            value={section.id}
            className="border rounded-lg px-4 bg-card"
          >
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                <section.icon className="h-5 w-5 text-primary shrink-0" />
                <span className="font-semibold text-base text-foreground">{section.title}</span>
                {section.badge && (
                  <Badge variant="secondary" className="text-[10px] h-4">{section.badge}</Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-5 pt-1">
                {section.content.map((block, bi) => (
                  <div key={bi}>
                    <h3 className="font-semibold text-sm text-foreground mb-2">{block.subtitle}</h3>
                    <ul className="space-y-1.5">
                      {block.steps.map((step, si) => (
                        <li key={si} className="text-sm text-muted-foreground flex gap-2">
                          <span className="text-primary shrink-0 mt-0.5">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}

        {isAdmin && (
          <>
            <div className="pt-2 pb-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Administração</p>
            </div>
            {ADMIN_SECTIONS.map((section) => (
              <AccordionItem
                key={section.id}
                value={section.id}
                className="border rounded-lg px-4 bg-card"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <section.icon className="h-5 w-5 text-primary shrink-0" />
                    <span className="font-semibold text-base text-foreground">{section.title}</span>
                    {section.badge && (
                      <Badge variant="secondary" className="text-[10px] h-4">{section.badge}</Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-5 pt-1">
                    {section.content.map((block, bi) => (
                      <div key={bi}>
                        <h3 className="font-semibold text-sm text-foreground mb-2">{block.subtitle}</h3>
                        <ul className="space-y-1.5">
                          {block.steps.map((step, si) => (
                            <li key={si} className="text-sm text-muted-foreground flex gap-2">
                              <span className="text-primary shrink-0 mt-0.5">•</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </>
        )}
      </Accordion>
    </div>
  );
}
