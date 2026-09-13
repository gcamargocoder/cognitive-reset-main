export type Technique = {
  slug: string;
  number: number;
  name: string;
  /** O que é e por que funciona (1-2 frases). */
  whatWhy: string;
  /** Preparação: postura ou ambiente ideal. */
  preparation: string;
  /** Passo a passo guiado — instruções de ação diretas. */
  steps: string[];
  /** Dica de apoio opcional para quando a pessoa sentir dificuldade. */
  tip?: string;
  /** Frequência sonora recomendada para tocar durante o exercício. */
  frequency?: { hz: number; label: string; src: string };
  tool:
    | "breathing"
    | "grounding"
    | "braindump"
    | "journal"
    | "tribunal"
    | "steps"
    | "timer"
    | "dive"
    | "surf"
    | "contract"
    | "pmr"
    | "somatic-scan"
    | "escalation-diary"
    | "none";
  toolConfig?: Record<string, unknown>;
  caution?: string;
};

export type Session = {
  slug: "ansiedade" | "panico" | "depressao" | "irritabilidade";
  title: string;
  subtitle: string;
  science: { heading: string; body: string }[];
  techniques: Technique[];
};

const FREQ_ANSIEDADE = {
  hz: 432,
  label: "432 Hz — Relaxamento e Desaceleração",
  src: "/audio/frequencia-ansiedade.mp3",
};
const FREQ_PANICO = {
  hz: 396,
  label: "396 Hz — Alívio de Medo e Aterramento",
  src: "/audio/frequencia-panico.mp3",
};
const FREQ_DEPRESSAO = {
  hz: 528,
  label: "528 Hz — Clareza e Renovação de Energia",
  src: "/audio/frequencia-depressao.mp3",
};
const FREQ_IRRITABILIDADE = {
  hz: 432,
  label: "432 Hz — Alívio de Tensão e Impulsividade",
  src: "/audio/frequencia-irritabilidade.mp3",
};

const recomeco: Technique = {
  slug: "respiracao-do-recomeco",
  number: 1,
  name: "Respiração do Recomeço (Suspiro Fisiológico)",
  whatWhy:
    "Duas inspiradas pelo nariz seguidas de uma expiração longa pela boca. É a forma mais rápida de baixar a ativação do corpo, porque remove o excesso de gás carbônico do sangue em poucos ciclos.",
  preparation: "Sente-se ou deite em uma posição confortável. Não precisa fechar os olhos.",
  steps: [
    "Inspire pelo nariz de forma rápida, por cerca de 2 segundos.",
    "Ainda pelo nariz, puxe um pouco mais de ar, como se completasse os pulmões.",
    "Solte todo o ar pela boca, bem devagar, por cerca de 6 segundos.",
    "Repita o ciclo mais 2 vezes (3 ciclos no total) e depois volte a respirar normalmente.",
  ],
  tip: "Se sentir tontura, pare e respire normalmente por um minuto antes de tentar de novo.",
  frequency: FREQ_ANSIEDADE,
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
  whatWhy:
    "Nomear coisas concretas ao seu redor tira a mente de pensamentos catastróficos e traz a atenção de volta para o momento presente, onde você está seguro.",
  preparation: "Fique onde estiver. Não precisa se mover, só olhar e perceber ao redor.",
  steps: [
    "Nomeie 5 coisas que você consegue ver agora.",
    "Nomeie 4 coisas que você pode tocar — toque nelas se conseguir.",
    "Nomeie 3 sons que você escuta neste momento.",
    "Nomeie 2 cheiros e 1 sabor (real ou lembrado) para fechar o exercício.",
  ],
  tip: "Se não conseguir sentir cheiro ou sabor agora, vale nomear um de que você gosta.",
  frequency: FREQ_ANSIEDADE,
  tool: "grounding",
};

const quadrada: Technique = {
  slug: "respiracao-quadrada",
  number: 3,
  name: "Respiração Quadrada (Box Breathing)",
  whatWhy:
    "Respirar em quatro tempos iguais ativa o sistema nervoso que acalma o corpo e ajuda a regular o coração acelerado.",
  preparation: "Sente-se com a coluna ereta, mãos apoiadas no colo ou nas pernas.",
  steps: [
    "Inspire pelo nariz contando até 4.",
    "Segure o ar contando até 4.",
    "Solte o ar pela boca contando até 4.",
    "Fique sem ar contando até 4 e recomece — faça 5 ciclos completos, sem forçar.",
  ],
  tip: "Se contar até 4 for difícil, comece contando até 3 e vá aumentando aos poucos.",
  frequency: FREQ_ANSIEDADE,
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
  whatWhy:
    "Escrever tudo o que vem à cabeça, sem filtro, tira os pensamentos repetitivos da sua mente e os coloca no papel, aliviando a sobrecarga.",
  preparation:
    "Pegue papel e caneta, ou abra um bloco de notas. Separe 10 minutos sem interrupções.",
  steps: [
    "Programe um cronômetro de 10 minutos.",
    "Escreva tudo o que vier à cabeça, sem organizar e sem se corrigir.",
    "Pode ser frase solta, palavra repetida, reclamação ou medo — não precisa fazer sentido.",
    "Quando o tempo acabar, pare de escrever. Se quiser, rasgue ou apague o que escreveu.",
  ],
  tip: "Travou? Escreva 'não sei o que escrever' até um pensamento novo aparecer.",
  frequency: FREQ_ANSIEDADE,
  tool: "braindump",
  toolConfig: { minutes: 10 },
};

const exame: Technique = {
  slug: "examinando-o-pensamento",
  number: 5,
  name: "Examinando o Pensamento",
  whatWhy:
    "Colocar um pensamento ansioso à prova, com evidências reais, mostra que ele não é um fato absoluto — só uma interpretação possível.",
  preparation: "Escolha um lugar tranquilo para escrever com calma.",
  steps: [
    "Escreva o pensamento ansioso exatamente como ele aparece na sua cabeça.",
    "Liste as evidências reais de que esse pensamento é verdadeiro.",
    "Liste as evidências reais contra esse pensamento.",
    "Escreva uma versão mais equilibrada, baseada no que você listou.",
  ],
  tip: "Se travar na lista 'contra', pergunte-se: 'o que eu diria a um amigo com esse mesmo pensamento?'",
  frequency: FREQ_ANSIEDADE,
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
  whatWhy:
    "O contato com água bem fria no rosto ativa um reflexo natural do corpo que baixa os batimentos do coração em poucos segundos, interrompendo a escalada do pânico.",
  preparation: "Vá até uma pia ou pegue uma bacia com água bem fria — gelo, se tiver.",
  steps: [
    "Respire fundo uma vez e prenda o ar por um instante.",
    "Mergulhe o rosto na água por 15 a 30 segundos — ou passe água gelada nas têmporas, pescoço e pulsos.",
    "Levante devagar e volte a respirar normalmente.",
    "Repita mais uma vez se a crise ainda estiver forte.",
  ],
  tip: "Sem água por perto? Uma bolsa de gelo ou até uma lata gelada nas têmporas já ajuda.",
  caution:
    "Se você tem alguma condição cardíaca, converse com seu médico antes de usar esta técnica.",
  frequency: FREQ_PANICO,
  tool: "dive",
};

const surfar: Technique = {
  slug: "surfar-a-onda",
  number: 7,
  name: "Surfar a Onda",
  whatWhy:
    "A crise de pânico sobe, atinge um pico e desce sozinha — geralmente em poucos minutos. Observar em vez de lutar contra ela é o que mais reduz o tempo da crise.",
  preparation: "Sente-se ou encoste-se em algum lugar estável, se puder.",
  steps: [
    "Diga para si mesmo: 'isto é uma onda, ela sobe e desce sozinha'.",
    "Observe as sensações no corpo sem tentar fazê-las parar.",
    "Nomeie o que sente, por exemplo: 'coração acelerado', 'mãos formigando'.",
    "Espere a onda passar — o pico costuma durar cerca de 10 minutos.",
  ],
  tip: "Quanto mais você tenta fazer a crise parar, mais ela demora. Só observar já ajuda a atravessar mais rápido.",
  frequency: FREQ_PANICO,
  tool: "surf",
  toolConfig: { minutes: 10 },
};

const intero: Technique = {
  slug: "exposicao-interoceptiva",
  number: 8,
  name: "Exposição Interoceptiva",
  whatWhy:
    "Provocar de forma leve e segura uma sensação parecida com a da crise, fora do momento de pânico, ensina o cérebro que essa sensação não é perigosa.",
  preparation: "Escolha um dia tranquilo, sem compromissos urgentes logo em seguida.",
  steps: [
    "Escolha uma sensação para provocar: girar na cadeira por 20 segundos, subir escadas rápido ou respirar mais rápido por 30 segundos.",
    "Faça o movimento escolhido pelo tempo indicado.",
    "Pare e observe: a sensação está aqui, e nada de grave está acontecendo.",
    "Espere a sensação passar naturalmente e anote o nível de medo antes e depois.",
  ],
  tip: "Comece pela versão mais leve da sensação. Você pode aumentar aos poucos, em outro dia.",
  caution:
    "Pare se sentir dor. Se tiver condição cardíaca ou respiratória, converse com seu médico antes.",
  frequency: FREQ_PANICO,
  tool: "journal",
  toolConfig: {
    prompts: [
      "Qual sensação você treinou hoje?",
      "De 0 a 10, quanto de medo no começo?",
      "E no fim?",
    ],
  },
};

const vago: Technique = {
  slug: "regulacao-nervo-vago",
  number: 9,
  name: "Regulação Diária pelo Nervo Vago",
  whatWhy:
    "Expirar mais devagar do que inspira, todo dia, treina o corpo a voltar à calma mais rápido depois de qualquer susto.",
  preparation: "Faça de preferência à noite, sentado ou deitado.",
  steps: [
    "Inspire suave pelo nariz contando até 4.",
    "Solte o ar pela boca contando até 8, com um som contínuo (tipo 'vvv' ou cantarolando).",
    "Repita por 8 ciclos completos.",
    "Ao terminar, fique alguns segundos só observando como o corpo está.",
  ],
  tip: "Se 8 tempos de expiração for difícil no início, comece com 6 e vá aumentando aos poucos.",
  frequency: FREQ_PANICO,
  tool: "breathing",
  toolConfig: {
    pattern: [
      { label: "Inspire suave", secs: 4 },
      { label: "Expire longo com som", secs: 8 },
    ],
    cycles: 8,
  },
};

const mapa: Technique = {
  slug: "mapeamento-de-crises",
  number: 16,
  name: "Mapeamento de Crises",
  whatWhy:
    "Registrar o que aconteceu antes, durante e depois de uma crise revela padrões — e entender o padrão devolve a sensação de controle.",
  preparation: "Faça esse registro depois da crise, quando já estiver mais calmo.",
  steps: [
    "Anote onde você estava e o que estava acontecendo antes da crise começar.",
    "Anote quais sinais o corpo deu primeiro.",
    "Anote o que ajudou você a atravessar a crise.",
    "Guarde esse registro — ele é o seu mapa pessoal para a próxima vez.",
  ],
  tip: "Não se cobre por detalhes perfeitos. Mesmo um registro simples já ajuda a enxergar o padrão.",
  frequency: FREQ_PANICO,
  tool: "journal",
  toolConfig: {
    prompts: [
      "Onde você estava e o que aconteceu antes?",
      "Quais sinais o corpo deu primeiro?",
      "O que ajudou a atravessar?",
    ],
  },
};

const tribunal: Technique = {
  slug: "tribunal-dos-pensamentos",
  number: 10,
  name: "O Tribunal dos Pensamentos",
  whatWhy:
    "Julgar um pensamento autocrítico como se fosse um caso em tribunal — com provas dos dois lados — mostra que ele não é uma sentença definitiva.",
  preparation: "Escolha um pensamento autocrítico recente para trabalhar.",
  steps: [
    "Escreva a acusação: o pensamento, exatamente com as palavras que ele usa.",
    "Escreva as provas a favor desse pensamento.",
    "Escreva as provas contra esse pensamento.",
    "Escreva o veredito: a conclusão mais justa possível, baseada nas provas.",
  ],
  tip: "Se as provas 'contra' não vierem fácil, pense no que diria a um amigo que se acusasse disso.",
  frequency: FREQ_DEPRESSAO,
  tool: "tribunal",
  toolConfig: {
    prompts: [
      "A acusação (o pensamento)",
      "Provas a favor",
      "Provas contra",
      "Veredito equilibrado",
    ],
  },
};

const desfusao: Technique = {
  slug: "desfusao-cognitiva",
  number: 11,
  name: "Desfusão Cognitiva",
  whatWhy:
    "Trocar 'eu sou um fracasso' por 'estou percebendo o pensamento de que sou um fracasso' muda a relação com o pensamento, mesmo sem mudar o conteúdo dele.",
  preparation: "Escolha um pensamento fixo e incômodo para trabalhar.",
  steps: [
    "Escreva o pensamento exatamente como ele aparece.",
    "Reescreva-o começando com: 'Estou percebendo o pensamento de que...'.",
    "Leia a nova versão em voz alta, devagar.",
    "Observe o que mudou na intensidade do pensamento.",
  ],
  tip: "Repita esse exercício sempre que o mesmo pensamento voltar — o efeito cresce com a repetição.",
  frequency: FREQ_DEPRESSAO,
  tool: "journal",
  toolConfig: {
    prompts: [
      "Escreva o pensamento",
      "Estou percebendo o pensamento de que...",
      "O que mudou ao ler assim?",
    ],
  },
};

const tresMomentos: Technique = {
  slug: "registro-dos-3-momentos",
  number: 12,
  name: "Registro dos 3 Momentos",
  whatWhy:
    "A depressão filtra o que é bom para fora da atenção. Registrar momentos concretos todos os dias treina o cérebro a notá-los de novo.",
  preparation: "Faça de preferência à noite, antes de dormir.",
  steps: [
    "Escreva um momento neutro ou bom que aconteceu hoje.",
    "Escreva algo que você fez, mesmo que pareça pequeno.",
    "Escreva algo pelo qual sente um mínimo de gratidão.",
    "Releia o que escreveu antes de guardar.",
  ],
  tip: "Nos dias difíceis, 'consegui sair da cama' já conta como uma ação válida.",
  frequency: FREQ_DEPRESSAO,
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
  whatWhy:
    "Na depressão, a ação vem antes da vontade, não depois. Um passo tão pequeno que é quase impossível não fazer já libera a dopamina que falta.",
  preparation: "Escolha uma tarefa que está parada há um tempo.",
  steps: [
    "Reduza a tarefa a um passo tão pequeno que fica quase impossível não fazer (ex: 'sentar na borda da cama').",
    "Faça só esse passo, nada além dele.",
    "Pare. Se quiser continuar, ótimo — se não quiser, o passo já valeu.",
    "Registre o que você fez, mesmo que tenha sido mínimo.",
  ],
  tip: "Se ainda parecer grande, reduza de novo. Não existe passo pequeno demais.",
  frequency: FREQ_DEPRESSAO,
  tool: "steps",
  toolConfig: {
    prompts: ["Qual é o passo tão pequeno que é quase impossível não fazer?", "Feito? Como foi?"],
  },
};

const ritmico: Technique = {
  slug: "movimento-ritmico",
  number: 14,
  name: "Movimento Rítmico",
  whatWhy:
    "Movimentos repetitivos e ritmados aumentam substâncias no cérebro ligadas a energia e humor, ajudando a sair do estado de torpor.",
  preparation:
    "Escolha um movimento simples: caminhar, pedalar, balançar o corpo ou dançar bem devagar.",
  steps: [
    "Comece o movimento escolhido, sem se preocupar com desempenho.",
    "Se quiser, coloque uma mão no peito e outra no braço, num toque suave, enquanto se move.",
    "Continue por 10 minutos, prestando atenção no ritmo, não no esforço.",
    "Ao terminar, observe se algo mudou no corpo — mesmo que seja muito pouco.",
  ],
  tip: "Vale começar com só 2 minutos. O importante é repetir, não a duração.",
  frequency: FREQ_DEPRESSAO,
  tool: "timer",
  toolConfig: { minutes: 10 },
};

const coerente: Technique = {
  slug: "respiracao-coerente",
  number: 15,
  name: "Respiração Coerente",
  whatWhy:
    "Respirar em torno de 6 vezes por minuto sincroniza coração e respiração, o que melhora a capacidade do corpo de se acalmar sozinho.",
  preparation: "Sente-se ou deite-se confortavelmente, de preferência antes de dormir.",
  steps: [
    "Inspire pelo nariz contando até 5.",
    "Solte o ar contando até 5.",
    "Repita esse ciclo por cerca de 5 minutos (cerca de 12 ciclos).",
    "Ao terminar, respire normalmente e observe o corpo por alguns segundos.",
  ],
  tip: "Se perder a conta, não tem problema — só volte a contar no próximo ciclo.",
  frequency: FREQ_DEPRESSAO,
  tool: "breathing",
  toolConfig: {
    pattern: [
      { label: "Inspire", secs: 5 },
      { label: "Expire", secs: 5 },
    ],
    cycles: 12,
  },
};

const memoria: Technique = {
  slug: "relacao-com-a-memoria",
  number: 17,
  name: "Mudando a Relação com a Memória",
  whatWhy:
    "Toda vez que uma memória é lembrada, ela fica maleável por um instante. Isso permite regravá-la com um pouco mais de cuidado, sem apagar o que aconteceu.",
  preparation: "Escolha uma lembrança difícil, mas que você já consiga tocar sem se desorganizar.",
  steps: [
    "Descreva a lembrança em três linhas, como se contasse para um amigo.",
    "Escreva o que você sabe hoje que não sabia naquele momento.",
    "Escreva uma frase de cuidado para a versão de você daquela época.",
    "Releia as três partes antes de encerrar.",
  ],
  tip: "Se a lembrança for muito pesada, converse com um profissional antes de revisitá-la sozinho.",
  frequency: FREQ_DEPRESSAO,
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
  whatWhy:
    "Escrever e assinar uma decisão faz o cérebro registrá-la como um evento real — não como só mais um pensamento passageiro.",
  preparation: "Escolha um momento tranquilo, sem pressa.",
  steps: [
    "Leia o contrato de compromisso em voz alta, devagar.",
    "Escreva seu nome completo abaixo dele.",
    "Assine, como se estivesse assinando algo oficial.",
    "Guarde o contrato para reler nos dias mais difíceis.",
  ],
  tip: "Releia sempre que a vontade de desistir aparecer — é para isso que ele existe.",
  frequency: FREQ_DEPRESSAO,
  tool: "contract",
};

const pmr: Technique = {
  slug: "relaxamento-muscular-progressivo",
  number: 19,
  name: "Relaxamento Muscular Progressivo (Jacobson)",
  whatWhy:
    "Tensionar e soltar cada grupo muscular de propósito ensina o corpo a reconhecer e liberar a tensão que a irritação acumula, sem precisar de raciocínio.",
  preparation: "Sente-se ou deite-se num lugar em que possa tensionar o corpo sem se machucar.",
  steps: [
    "Tensione um grupo muscular por 5 segundos (mãos, braços, ombros, rosto, barriga ou pernas).",
    "Solte de uma vez e perceba o alívio por 10 segundos.",
    "Passe para o próximo grupo muscular e repita.",
    "Ao terminar todos os grupos, respire fundo três vezes.",
  ],
  tip: "Se algum grupo doer ao tensionar, pule para o próximo — nunca force além do confortável.",
  frequency: FREQ_IRRITABILIDADE,
  tool: "pmr",
};

const somatica: Technique = {
  slug: "visao-panoramica-somatica",
  number: 20,
  name: "Visão Panorâmica Somática",
  whatWhy:
    "Ampliar o campo de visão avisa ao corpo que não há perigo por perto — o oposto da visão em túnel que a raiva provoca.",
  preparation: "Fique parado onde estiver, sem precisar fechar os olhos.",
  steps: [
    "Sem mover a cabeça, amplie o olhar até notar as bordas do ambiente ao seu redor.",
    "Nomeie mentalmente 3 pontos fixos que você vê sem mover a cabeça.",
    "Perceba o peso do corpo apoiado — os pés no chão ou o corpo na cadeira.",
    "Alongue a expiração por alguns ciclos, deixando-a mais longa que a inspiração.",
  ],
  tip: "Se a mente insistir em voltar ao gatilho, só volte a nomear os pontos fixos — sem se cobrar.",
  frequency: FREQ_IRRITABILIDADE,
  tool: "somatic-scan",
};

const diarioDesescalada: Technique = {
  slug: "diario-de-desescalada",
  number: 21,
  name: "Diário de Desescalada",
  whatWhy:
    "Nomear o gatilho, a sensação física e o pensamento devolve a situação para a parte racional do cérebro, no lugar da reação automática de luta.",
  preparation:
    "Faça esse registro depois do pico, quando já conseguir pensar com um pouco mais de calma.",
  steps: [
    "Identifique o que disparou a irritação.",
    "Anote as sensações físicas que vieram junto (mandíbula travada, mãos quentes, etc.).",
    "Troque o pensamento hostil automático por uma leitura mais neutra da situação.",
    "Escolha uma ação assertiva e, se precisar, um tempo de isolamento saudável antes de agir.",
  ],
  tip: "Se ainda estiver muito ativado, espere alguns minutos antes de preencher — o registro funciona melhor com a cabeça mais fria.",
  frequency: FREQ_IRRITABILIDADE,
  tool: "escalation-diary",
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
  {
    slug: "irritabilidade",
    title: "Sessão 4 — Irritabilidade",
    subtitle: "Regulando o pavio curto antes que ele exploda",
    science: [
      {
        heading: "Teoria Polivagal",
        body: "O nervo vago monitora sinais de segurança ou ameaça no ambiente sem passar pelo pensamento consciente. Quando ele detecta perigo, o corpo entra em modo de luta: mandíbula trava, mãos esquentam, a visão fecha em túnel. Sinais de segurança — respiração longa, campo de visão amplo — desligam esse modo.",
      },
      {
        heading: "TIPP (DBT)",
        body: "Temperatura, Exercício Intenso, Respiração Ritmada e Relaxamento Muscular são as quatro ferramentas da Terapia Comportamental Dialética para mudar a química do corpo em minutos, não em horas — o choque de água fria e a descarga motora agem direto no sistema nervoso, sem precisar de raciocínio.",
      },
      {
        heading: "Pensamento Hostil Automático (TCC)",
        body: "A raiva costuma vir de uma interpretação automática ('ele fez de propósito', 'estão me desrespeitando') que raramente é checada. Trocar essa leitura por uma interpretação neutra não anula o sentimento — mas tira a lenha automática da fogueira.",
      },
    ],
    techniques: [pmr, somatica, diarioDesescalada],
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
