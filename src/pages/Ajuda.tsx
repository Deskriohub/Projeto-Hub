import { HelpCircle, Home, Smile, MessageCircle, CalendarRange, Lightbulb, Bot, Megaphone, BarChart3, Users, Settings, Bell, CalendarPlus, BookOpen } from "lucide-react";
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
          "Ao entrar, você cai direto na Home, com uma saudação pelo seu nome.",
          "Missão, Visão e Valores da empresa no topo.",
          "Mural de Avisos: os comunicados da empresa direcionados a você.",
          "Mural de Elogios: reconhecimentos recentes.",
          "Calendário do mês com tudo que tem data: eventos, avisos e reuniões 1:1.",
        ],
      },
      {
        subtitle: "O Calendário",
        steps: [
          "📅 Eventos — em cores variadas.",
          "📢 Avisos com data — em amarelo.",
          "👥 Reuniões 1:1 — em azul, com a hora.",
          "Use as setas ← → para mudar de mês.",
          "Clique em um dia para ver os compromissos daquele dia no painel abaixo.",
          "Clique em um evento para abrir e ver/editar todas as informações.",
        ],
      },
    ],
  },
  {
    id: "notificacoes",
    icon: Bell,
    title: "Notificações (o sino) 🔔",
    content: [
      {
        subtitle: "Como funciona",
        steps: [
          "No topo da tela, ao lado da sua foto, há um sino.",
          "Um número vermelho indica quantas notificações você ainda não leu.",
          "Clique no sino para ver a lista. Clique numa notificação para ir direto ao item.",
          "Use 'Marcar todas' para limpar as não lidas.",
          "Abaixo das notificações, aparecem seus próximos compromissos (7 dias).",
        ],
      },
      {
        subtitle: "Quando você recebe uma notificação",
        steps: [
          "Quando alguém responde sua sugestão.",
          "Quando você recebe um feedback.",
          "Quando um aviso é direcionado a você.",
          "Quando te marcam num evento ou agendam/remarcam um 1:1 com você.",
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
        subtitle: "Dar um elogio",
        steps: [
          "1. Acesse 'Mural de Elogios' e clique em 'Novo Elogio'.",
          "2. Escolha um emoji, selecione o colega e escreva a mensagem.",
          "3. Marque 'Público' para todos verem, ou deixe privado.",
          "4. Envie. Você pode reagir aos elogios de outros com emojis.",
        ],
      },
      {
        subtitle: "Fotos no mural",
        steps: [
          "Cada elogio mostra a foto de quem enviou e de quem recebeu.",
          "Clique no card para abrir com as fotos maiores e a mensagem completa.",
        ],
      },
    ],
  },
  {
    id: "feedbacks",
    icon: MessageCircle,
    title: "Feedback Pós-1:1",
    content: [
      {
        subtitle: "O que é",
        steps: [
          "Um feedback privado vinculado a uma reunião 1:1 (só quem envia e quem recebe veem).",
          "Três tipos: Positivo (verde), Construtivo (laranja), Negativo (vermelho).",
        ],
      },
      {
        subtitle: "Como enviar",
        steps: [
          "1. Abra a reunião em 'Minhas Reuniões' → Visualizar.",
          "2. Clique em 'Feedback Pós-1:1' (no topo).",
          "3. O destinatário já vem preenchido com o outro participante; escolha o tipo e escreva.",
          "4. Envie — a pessoa recebe uma notificação e o feedback aparece na própria reunião, em 'Feedbacks desta reunião'.",
        ],
      },
    ],
  },
  {
    id: "eventos",
    icon: CalendarPlus,
    title: "Eventos",
    content: [
      {
        subtitle: "Criar um evento",
        steps: [
          "Acesse 'Eventos' (menu Recursos) ou clique num dia do calendário.",
          "1. Preencha título, data (e data fim, se durar vários dias).",
          "2. Hora início/fim — deixe em branco para um evento de dia inteiro.",
          "3. Descrição (opcional).",
          "4. Visibilidade: 'Mostrar no calendário' (todos) ou 'Só para mim' (lembrete pessoal).",
          "5. 'Marcar pessoas' — quem você marcar recebe notificação e vê o evento no calendário dele.",
        ],
      },
      {
        subtitle: "Repetir todo mês",
        steps: [
          "Ao criar, marque 'Repetir todo mês' e escolha por quantos meses (2 a 12).",
          "Cria um evento por mês, na mesma data e hora.",
          "Cada ocorrência é independente — dá para editar a data/hora de um mês só, sem mexer nos outros.",
        ],
      },
      {
        subtitle: "Página Eventos",
        steps: [
          "Lista todos os eventos agrupados por mês.",
          "Clique em qualquer evento para abrir, ver as informações e editar.",
          "O que você cria aqui aparece automaticamente no calendário da Home.",
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
        subtitle: "Minhas Reuniões (usuário/liderado)",
        steps: [
          "Acesse One-on-One → 'Minhas reuniões' para ver seus 1:1.",
          "Cada card mostra a data, a hora e os próximos passos.",
          "Você marca como concluídos os próximos passos sob SUA responsabilidade (Liderado).",
        ],
      },
      {
        subtitle: "Próximos Passos (o que são)",
        steps: [
          "São os combinados que saem da reunião — o que cada um vai fazer até o próximo encontro.",
          "Cada item tem um Responsável: Líder (gestor) ou Liderado (você).",
          "Quem é responsável marca como concluído — fica registrado quem fez e quando.",
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
        subtitle: "O que são",
        steps: [
          "Comunicados da empresa. Aparecem no Mural de Avisos da Home.",
          "Podem ser direcionados a pessoas específicas (você só vê os destinados a você).",
          "Quando têm data de início, aparecem também no calendário.",
        ],
      },
    ],
  },
  {
    id: "sugestoes",
    icon: Lightbulb,
    title: "Minhas Sugestões",
    content: [
      {
        subtitle: "Enviar e acompanhar",
        steps: [
          "Acesse 'Minhas Sugestões' e clique em 'Nova sugestão'.",
          "Escreva sua ideia. Marque 'anônima' se não quiser se identificar (aí não fica vinculada a você).",
          "Quando a equipe responder, você recebe uma notificação e a resposta aparece no card.",
          "Você pode excluir suas próprias sugestões.",
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
        subtitle: "O que é",
        steps: [
          "O assistente virtual da DeskRio — funciona como um ChatGPT interno.",
          "Responde dúvidas sobre a plataforma, sobre processos da empresa, perguntas de clientes e questões gerais de trabalho.",
          "Ele aprende com os materiais que o admin sobe na Base de Conhecimento.",
        ],
      },
      {
        subtitle: "Como usar",
        steps: [
          "Acesse 'Deskinho' no menu, digite sua pergunta e pressione Enter.",
          "Ele responde em tempo real. Continue a conversa com perguntas de acompanhamento.",
          "Clique em 'Limpar' para começar uma conversa nova.",
        ],
      },
    ],
  },
];

const ADMIN_SECTIONS: Section[] = [
  {
    id: "oneonone-admin",
    icon: CalendarRange,
    title: "One-on-One (Líder / Admin)",
    badge: "Admin",
    content: [
      {
        subtitle: "Todas as reuniões",
        steps: [
          "Admin vê só 'Todas as reuniões' (o líder não tem 1:1 próprio — acompanha os liderados).",
          "Cada card é um 1:1 de um liderado. Cards amarelos têm próximos passos pendentes.",
          "No topo, um cartão mostra quantos liderados têm itens em aberto — clique para filtrar.",
          "Use os filtros (Liderado, Mês, Pendências) e 'Ver próximos passos' para acompanhar.",
        ],
      },
      {
        subtitle: "Criar um 1:1",
        steps: [
          "Clique em 'Novo One-on-One': escolha o liderado, data e hora, escreva as anotações.",
          "Adicione os Próximos Passos com o responsável (Líder ou Liderado).",
          "Marque 'Repetir todo mês' para criar vários encontros mensais de uma vez.",
          "O liderado recebe notificação do agendamento (e de remarcações).",
        ],
      },
      {
        subtitle: "Agendar para o time todo",
        steps: [
          "Em 'Todas as reuniões', clique em 'Agendar para o time'.",
          "Adicione várias pessoas, cada uma com sua data e hora ('Adicionar time todo' preenche todos).",
          "Opção de repetir mensalmente. Cria tudo de uma vez e notifica cada pessoa.",
        ],
      },
    ],
  },
  {
    id: "avisos-admin",
    icon: Megaphone,
    title: "Avisos (Admin)",
    badge: "Admin",
    content: [
      {
        subtitle: "Criar e direcionar",
        steps: [
          "Em 'Avisos', clique em 'Novo Aviso'. Preencha título, observação e link (opcionais).",
          "Início (opcional): a partir de quando aparece (e marca no calendário). Fim: quando some.",
          "'Enviar para': Todos OU Pessoas específicas — ótimo para separar times (N1, N2, admins).",
          "Só os destinatários veem o aviso no mural e no calendário, e são notificados.",
        ],
      },
    ],
  },
  {
    id: "usuarios",
    icon: Users,
    title: "Usuários (Admin)",
    badge: "Admin",
    content: [
      {
        subtitle: "Gerenciar usuários",
        steps: [
          "Em 'Usuários', veja todos os cadastrados e altere o perfil de cada um (Admin / Usuário).",
          "Na coluna Foto, passe o mouse no avatar e clique para subir a foto da pessoa (até 5MB).",
          "Novos usuários se cadastram pelo login; depois o admin define o perfil.",
        ],
      },
    ],
  },
  {
    id: "base-conhecimento",
    icon: BookOpen,
    title: "Base de Conhecimento da IA (Admin)",
    badge: "Admin",
    content: [
      {
        subtitle: "Alimentar o Deskinho",
        steps: [
          "Em Configurações → 'Base de Conhecimento da IA', clique em 'Enviar documento'.",
          "Aceita PDF, Word (.docx), PowerPoint (.pptx), imagem (PNG/JPG) e texto.",
          "PDFs com imagem e prints são lidos automaticamente por OCR (IA de visão).",
          "O sistema extrai o conteúdo e o Deskinho passa a usar nas respostas.",
          "Quanto mais materiais, mais o Deskinho sabe responder sobre a DeskRio.",
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
        subtitle: "Foto e senha (todos)",
        steps: [
          "Foto de perfil: clique em 'Alterar foto' (JPG/PNG/WebP, até 5MB).",
          "Senha: preencha a nova senha (mín. 6 caracteres) e confirme.",
        ],
      },
      {
        subtitle: "Auditoria — Admin",
        steps: [
          "Registra as últimas 100 ações na plataforma (feedbacks, sugestões, eventos, avisos, fotos, perfis…).",
          "Clique em qualquer registro para ver o histórico de Antes e Depois da mudança.",
          "Não registra ações no banco — só o que os usuários fazem na interface.",
        ],
      },
    ],
  },
  {
    id: "relatorios",
    icon: BarChart3,
    title: "Relatórios (Admin)",
    badge: "Admin",
    content: [
      {
        subtitle: "Dashboards",
        steps: [
          "Exibe dashboards do Power BI integrados à plataforma.",
          "Novos relatórios são configurados pelo time de TI/admin.",
        ],
      },
    ],
  },
];

function SectionAccordionItem({ section }: { section: Section }) {
  return (
    <AccordionItem value={section.id} className="border rounded-lg px-4 bg-card">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3">
          <section.icon className="h-5 w-5 text-primary shrink-0" />
          <span className="font-semibold text-base text-foreground">{section.title}</span>
          {section.badge && <Badge variant="secondary" className="text-[10px] h-4">{section.badge}</Badge>}
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
  );
}

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
          <SectionAccordionItem key={section.id} section={section} />
        ))}

        {isAdmin && (
          <>
            <div className="pt-2 pb-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Administração</p>
            </div>
            {ADMIN_SECTIONS.map((section) => (
              <SectionAccordionItem key={section.id} section={section} />
            ))}
          </>
        )}
      </Accordion>
    </div>
  );
}
