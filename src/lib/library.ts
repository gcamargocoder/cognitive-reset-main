export type Technique = {
  slug: string;
  number: number;
  name: string;
  when: string;
  steps: string[];
  why: string;
  tool: "breathing" | "grounding" | "braindump" | "journal" | "tribunal" | "steps" | "timer" | "dive" | "surf" | "contract" | "none";
  toolConfig?: Record<string, unknown>;
  caution?: string;
};

export type Session = {
  slug: "ansiedade" | "panico" | "depressao";
  title: string;
  subtitle: string;
  science: { heading: string; body: string }[];
  techniques: Technique[];
};

const recomeco: Technique = {
  slug: "respiracao-do-recomeco",
  number: 1,
  name: "Respiração do Recomeço (Suspiro Fisiológico)",
  when: "Quando o coração está acelerado, a respiração está curta ou existe aquela sensação de urgência difícil de controlar.",
  steps: [
    "Sente-se ou deite em qualquer posição confortável — não precisa fechar os olhos.",
    "Inspire pelo nariz de forma rápida, por cerca de 2 segundos.",
    "Ainda pelo nariz, inspire um pouco mais, como se enchesse os pulmões até o limite.",
    "Solte todo o ar pela boca, devagar, com um som suave de 'ahhh', por 6 segundos.",
    "Repita o ciclo completo mais 2 vezes (3 ciclos no total).",
    "Depois, respire normalmente e observe como o corpo responde.",
  ],
  why: "Esse padrão remove rapidamente o excesso de dióxido de carbono do sangue — um dos principais responsáveis pela sensação de sufocamento. O cérebro recebe o sinal: estamos seguros.",
  tool: "breathing",
  toolConfig: {
    pattern: [
      { label: "Inspire pelo nariz", secs: 2 },
      { label: "Complete a inspiração", secs: 1 },
      { label: "Expire pela boca", secs: 6 },
    ],
    cycles: 3,
  },
};

const ancoragem: Technique = {
  slug: "ancoragem-5-4-3-2-1",
  number: 2,
  name: "Ancoragem no Presente (5-4-3-2-1)",
  when: "Quando a mente entra em espiral, você se sente desconectado ou a ansiedade te leva para um futuro catastrófico.",
  steps: [
    "Olhe ao redor e nomeie 5 coisas que você vê.",
    "Perceba 4 coisas que você pode tocar — e toque, se puder.",
    "Escute e nomeie 3 sons.",
    "Identifique 2 cheiros (ou dois cheiros de que você gosta).",
    "Nomeie 1 sabor, ou algo que você gostaria de sentir o sabor.",
  ],
  why: "O cérebro não consegue catastrofizar e catalogar o presente ao mesmo tempo. Nomear estímulos concretos reengaja o córtex pré-frontal e retira potência do circuito do medo.",
  tool: "grounding",
};

const quadrada: Technique = {
  slug: "respiracao-quadrada",
  number: 3,
  name: "Respiração Quadrada (Box Breathing)",
  when: "Para ansiedade constante de fundo, tensão acumulada ou antes de situações que você já sabe que ativam o alarme.",
  steps: [
    "Inspire pelo nariz contando até 4.",
    "Segure o ar contando até 4.",
    "Expire pela boca contando até 4.",
    "Fique sem ar contando até 4 — e reinicie.",
    "Faça 5 ciclos completos, sem forçar.",
  ],
  why: "Ciclos iguais ativam o sistema nervoso parassimpático e aumentam a variabilidade da frequência cardíaca, o freio natural do corpo.",
  tool: "breathing",
  toolConfig: {
    pattern: [
      { label: "Inspire", secs: 4 },
      { label: "Segure", secs: 4 },
      { label: "Expire", secs: 4 },
      { label: "Segure", secs: 4 },
    ],
    cycles: 5,
  },
};

const braindump: Technique = {
  slug: "brain-dump",
  number: 4,
  name: "Brain Dump (Descarga Mental)",
  when: "Quando a cabeça não para, os pensamentos se repetem em loop ou você não consegue dormir de tanto pensar.",
  steps: [
    "Programe 10 minutos.",
    "Escreva tudo o que vier à cabeça, sem organizar e sem corrigir.",
    "Pode ser frases soltas, palavras, reclamações, medos, raiva — tudo.",
    "Quando o tempo terminar, pare de escrever.",
    "Se quiser, 'rasgue' o papel. O objetivo é tirar de dentro, não guardar.",
  ],
  why: "Pensamentos repetitivos ocupam a memória de trabalho e mantêm o alarme ligado. A escrita expressiva transfere essa carga para fora e reduz a ativação emocional.",
  tool: "braindump",
  toolConfig: { minutes: 10 },
};

const exame: Technique = {
  slug: "examinando-o-pensamento",
  number: 5,
  name: "Examinando o Pensamento",
  when: "Quando um pensamento ansioso se apresenta como se fosse um fato inquestionável.",
  steps: [
    "Escreva o pensamento exatamente como ele aparece.",
    "Liste as evidências de que ele é verdade.",
    "Liste as evidências contra.",
    "Escreva uma versão mais equilibrada e realista.",
  ],
  why: "Examinar o pensamento recruta o córtex pré-frontal e enfraquece a associação automática entre pensamento e alarme.",
  tool: "journal",
  toolConfig: {
    prompts: [
      "Qual é o pensamento?",
      "Qual a evidência de que ele é verdade?",
      "Qual a evidência contra?",
      "Qual seria uma visão mais equilibrada?",
    ],
  },
};

const mergulho: Technique = {
  slug: "reflexo-do-mergulho",
  number: 6,
  name: "Reflexo do Mergulho (Água Fria)",
  when: "No pico de uma crise de pânico, quando você precisa de algo que funcione em segundos.",
  steps: [
    "Vá até uma pia ou pegue um recipiente com água bem fria.",
    "Prenda a respiração por um instante e mergulhe o rosto — ou aplique a água nas laterais do rosto e nos olhos.",
    "Permaneça de 15 a 30 segundos.",
    "Respire normalmente e repita uma vez, se precisar.",
  ],
  why: "O contato com a água fria no rosto ativa o reflexo do mergulho, mediado pelo nervo vago: a frequência cardíaca cai em segundos, interrompendo a escalada da crise.",
  caution: "Se você tem alguma condição cardíaca, consulte seu médico antes de usar esta técnica.",
  tool: "dive",
};

const surfar: Technique = {
  slug: "surfar-a-onda",
  number: 7,
  name: "Surfar a Onda",
  when: "Quando a crise está acontecendo e existe a necessidade urgente de fazê-la parar.",
  steps: [
    "Diga para si mesmo: 'isto é uma onda, ela sobe e desce'.",
    "Em vez de lutar, observe as sensações e onde elas estão no corpo.",
    "Nomeie o que sente: 'coração acelerado', 'formigamento'.",
    "Deixe a onda subir sem fugir — ela chega ao pico em torno de 10 minutos.",
    "Observe a descida. Você atravessou.",
  ],
  why: "Lutar contra a crise adiciona medo ao medo e prolonga a descarga de adrenalina. Observar sem fugir é o mecanismo central da extinção do medo.",
  tool: "surf",
  toolConfig: { minutes: 10 },
};

const intero: Technique = {
  slug: "exposicao-interoceptiva",
  number: 8,
  name: "Exposição Interoceptiva",
  when: "Fora da crise, em dias tranquilos, para treinar o cérebro a tolerar sensações corporais.",
  steps: [
    "Escolha um dia tranquilo, sem compromissos urgentes.",
    "Provoque, de forma leve e breve, uma sensação parecida com a da crise (girar na cadeira por 20s, subir escadas rápido, respirar mais rápido por 30s).",
    "Pare e observe: a sensação está aqui e nada de catastrófico acontece.",
    "Espere a sensação passar naturalmente.",
    "Anote o nível de medo antes e depois.",
  ],
  why: "Quem tem pânico aprende a temer as próprias sensações. Provocá-las de forma segura e ver que nada acontece reduz a interpretação de perigo — é o princípio da exposição.",
  caution: "Interrompa se sentir dor. Em caso de condição cardíaca ou respiratória, fale com seu médico antes.",
  tool: "journal",
  toolConfig: {
    prompts: ["Qual sensação você treinou hoje?", "De 0 a 10, quanto de medo no começo?", "E no fim?"],
  },
};

const vago: Technique = {
  slug: "regulacao-nervo-vago",
  number: 9,
  name: "Regulação Diária pelo Nervo Vago",
  when: "Todos os dias, como manutenção — especialmente à noite.",
  steps: [
    "Inspire suave pelo nariz por 4 segundos.",
    "Expire por 8 segundos, com um som contínuo ('vvv' ou cantarolando).",
    "Repita por 8 ciclos.",
    "Ao terminar, observe o corpo por alguns segundos.",
  ],
  why: "Expirações longas, som e vibração aumentam o tônus vagal. Melhor tônus vagal significa voltar ao estado de calma mais rápido depois de um susto.",
  tool: "breathing",
  toolConfig: {
    pattern: [
      { label: "Inspire suave", secs: 4 },
      { label: "Expire longo com som", secs: 8 },
    ],
    cycles: 8,
  },
};

const tribunal: Technique = {
  slug: "tribunal-dos-pensamentos",
  number: 10,
  name: "O Tribunal dos Pensamentos",
  when: "Quando a autocrítica aparece como verdade absoluta ('eu não sirvo para nada').",
  steps: [
    "Escreva a acusação: o pensamento, com as palavras dele.",
    "Escreva as provas a favor.",
    "Escreva as provas contra.",
    "Escreva o veredito: a conclusão mais justa possível.",
  ],
  why: "Avaliar em vez de aceitar reduz a ruminação e devolve ao córtex pré-frontal o papel de juiz.",
  tool: "tribunal",
  toolConfig: {
    prompts: ["A acusação (o pensamento)", "Provas a favor", "Provas contra", "Veredito equilibrado"],
  },
};

const desfusao: Technique = {
  slug: "desfusao-cognitiva",
  number: 11,
  name: "Desfusão Cognitiva",
  when: "Quando você se sente preso dentro de um pensamento, como se ele fosse a realidade absoluta.",
  steps: [
    "Escreva o pensamento como ele é.",
    "Reescreva assim: 'Estou percebendo o pensamento de que...'.",
    "Leia em voz alta, devagar.",
    "Observe o que muda na intensidade.",
  ],
  why: "Desfusão muda a relação com o pensamento em vez do conteúdo dele. A mente passa a observar de fora, e a carga emocional cai.",
  tool: "journal",
  toolConfig: {
    prompts: ["Escreva o pensamento", "Estou percebendo o pensamento de que...", "O que mudou ao ler assim?"],
  },
};

const tresMomentos: Technique = {
  slug: "registro-dos-3-momentos",
  number: 12,
  name: "Registro dos 3 Momentos",
  when: "Todos os dias, de preferência à noite — especialmente nos dias em que 'nada de bom aconteceu'.",
  steps: [
    "Escreva um momento neutro ou bom do dia.",
    "Escreva algo que você fez, mesmo mínimo.",
    "Escreva algo pelo qual sente um mínimo de gratidão.",
  ],
  why: "A depressão filtra estímulos positivos para fora. Registrar momentos concretos reativa a atenção seletiva a eles.",
  tool: "journal",
  toolConfig: {
    prompts: [
      "Um momento neutro ou bom de hoje",
      "Algo que você fez, mesmo pequeno",
      "Algo pelo qual sente um mínimo de gratidão",
    ],
  },
};

const passos: Technique = {
  slug: "passos-ridiculamente-pequenos",
  number: 13,
  name: "Passos Ridiculamente Pequenos",
  when: "Quando a vontade não vem e qualquer tarefa parece imensa.",
  steps: [
    "Escolha uma tarefa e reduza até ficar quase impossível não fazer ('sentar na borda da cama').",
    "Faça só esse passo.",
    "Pare. Se quiser continuar, ótimo. Se não, o passo já valeu.",
    "Registre o que foi feito.",
  ],
  why: "Cada pequena ação libera dopamina — o neurotransmissor prejudicado na depressão. Na depressão, a ação vem primeiro; a vontade vem depois.",
  tool: "steps",
  toolConfig: {
    prompts: ["Qual é o passo tão pequeno que é quase impossível não fazer?", "Feito? Como foi?"],
  },
};

const ritmico: Technique = {
  slug: "movimento-ritmico",
  number: 14,
  name: "Movimento Rítmico",
  when: "Em estado de torpor, anestesiado emocionalmente, sem sentir nada.",
  steps: [
    "Escolha um movimento repetitivo: caminhar, pedalar, balançar, dançar devagar.",
    "Mantenha por 10 minutos, sem meta de desempenho.",
    "Preste atenção ao ritmo, não ao esforço.",
    "Ao terminar, observe se algo mudou — mesmo 1%.",
  ],
  why: "Movimento ritmado aumenta serotonina e norepinefrina e ajuda a sair do estado de anestesia emocional.",
  tool: "timer",
  toolConfig: { minutes: 10 },
};

const coerente: Technique = {
  slug: "respiracao-coerente",
  number: 15,
  name: "Respiração Coerente",
  when: "Antes de dormir ou como prática diária de regulação.",
  steps: ["Inspire por 5 segundos.", "Expire por 5 segundos.", "Mantenha por 5 minutos (cerca de 12 ciclos)."],
  why: "Cerca de 6 respirações por minuto sincronizam coração e respiração, melhorando a variabilidade da frequência cardíaca.",
  tool: "breathing",
  toolConfig: {
    pattern: [
      { label: "Inspire", secs: 5 },
      { label: "Expire", secs: 5 },
    ],
    cycles: 12,
  },
};

const mapa: Technique = {
  slug: "mapeamento-de-crises",
  number: 16,
  name: "Mapeamento de Crises",
  when: "Depois de uma crise, com calma, para entender o padrão.",
  steps: [
    "Anote onde você estava e o que aconteceu antes.",
    "Anote quais sinais o corpo deu primeiro.",
    "Anote o que ajudou a atravessar.",
    "Guarde: esse é o seu mapa pessoal.",
  ],
  why: "Identificar sinais precoces permite agir antes do pico e devolve senso de previsibilidade e controle.",
  tool: "journal",
  toolConfig: {
    prompts: ["Onde você estava e o que aconteceu antes?", "Quais sinais o corpo deu primeiro?", "O que ajudou a atravessar?"],
  },
};

const memoria: Technique = {
  slug: "relacao-com-a-memoria",
  number: 17,
  name: "Mudando a Relação com a Memória",
  when: "Quando uma lembrança difícil continua doendo como se fosse hoje.",
  steps: [
    "Descreva a lembrança em três linhas, como se contasse a um amigo.",
    "Escreva o que você sabe hoje e não sabia naquele momento.",
    "Escreva uma frase de cuidado para aquela versão de você.",
  ],
  why: "Ao ser recordada, a memória fica momentaneamente maleável e é regravada junto com o contexto atual. Não é apagar o passado — é mudar a relação com ele.",
  tool: "journal",
  toolConfig: {
    prompts: [
      "Descreva a lembrança em 3 linhas",
      "O que você sabe hoje que não sabia lá?",
      "Que frase de cuidado você diria para aquela versão de você?",
    ],
  },
};

const contrato: Technique = {
  slug: "contrato-de-compromisso",
  number: 18,
  name: "Contrato de Compromisso Pessoal",
  when: "No começo do caminho — e nos dias em que bate a vontade de desistir.",
  steps: [
    "Leia o contrato em voz alta, devagar.",
    "Escreva seu nome e assine.",
    "Releia nos dias difíceis.",
  ],
  why: "Escrever e assinar faz o cérebro registrar a decisão como evento real e significativo, criando um ponto de ancoragem interno: 'eu decidi me cuidar'.",
  tool: "contract",
};

export const SESSIONS: Session[] = [
  {
    slug: "ansiedade",
    title: "Sessão 1 — Ansiedade",
    subtitle: "Entendendo e regulando o sistema nervoso ansioso",
    science: [
      {
        heading: "Amígdala x Córtex Pré-Frontal",
        body: "A amígdala detecta ameaças e dispara o alarme de luta ou fuga. Quando ela assume, o córtex pré-frontal — que pensa, planeja e decide — perde eficiência. Coração acelera, músculos tensionam, respiração encurta. Não é exagero: é biologia.",
      },
      {
        heading: "O ciclo da ansiedade",
        body: "Pensamento negativo → reação no corpo → evitação/fuga → mais ansiedade → e o ciclo se fecha. A boa notícia é que ele pode ser interrompido em qualquer ponto.",
      },
    ],
    techniques: [recomeco, ancoragem, quadrada, braindump, exame],
  },
  {
    slug: "panico",
    title: "Sessão 2 — Síndrome do Pânico",
    subtitle: "O que é a crise e como atravessá-la",
    science: [
      {
        heading: "A curva do pânico",
        body: "A crise é um alarme falso disparado com força máxima. Ela sobe, atinge o pico em torno de 10 minutos e desce. Nenhuma crise dura para sempre — o corpo não consegue sustentar aquele nível de adrenalina.",
      },
      {
        heading: "Sintomas físicos reais e explicáveis",
        body: "Coração acelerado leva sangue aos músculos. Falta de ar é a respiração buscando oxigênio. Tontura é redistribuição de fluxo. Formigamento é o sistema nervoso em alerta máximo. Sensação de irrealidade é sobrecarga de informação. O corpo está tentando te proteger — ele não vai te machucar.",
      },
    ],
    techniques: [mergulho, surfar, intero, vago, mapa],
  },
  {
    slug: "depressao",
    title: "Sessão 3 — Depressão",
    subtitle: "Saindo da inércia com gentileza",
    science: [
      {
        heading: "Neurotransmissores",
        body: "A depressão é uma condição neurológica real: envolve serotonina (humor e regulação emocional), dopamina (motivação e recompensa) e norepinefrina (energia e foco). Não é frescura, preguiça nem fraqueza de caráter.",
      },
      {
        heading: "O ciclo da ação",
        body: "Na depressão, a ação vem primeiro e a vontade vem depois. Pequena ação → liberação de dopamina → sensação de conquista → mais motivação. O ciclo virtuoso começa com a menor ação possível.",
      },
    ],
    techniques: [tribunal, desfusao, tresMomentos, passos, ritmico, coerente, memoria, contrato],
  },
];

export const ALL_TECHNIQUES: Technique[] = SESSIONS.flatMap((s) => s.techniques);

export function findTechnique(slug: string) {
  return ALL_TECHNIQUES.find((t) => t.slug === slug);
}

/** Técnicas usadas nos atalhos de SOS. */
export const SOS = {
  panico: [mergulho, surfar],
  ansiedade: [recomeco, ancoragem],
};
