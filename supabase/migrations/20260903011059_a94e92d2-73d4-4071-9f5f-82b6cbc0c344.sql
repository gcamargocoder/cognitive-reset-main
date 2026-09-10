-- Roles
CREATE TYPE public.app_role AS ENUM ('user','admin');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- Daily contents (reference content)
CREATE TABLE public.daily_contents (
  day integer PRIMARY KEY CHECK (day BETWEEN 1 AND 30),
  week integer NOT NULL DEFAULT 1,
  title text NOT NULL,
  technique text NOT NULL,
  science text NOT NULL,
  quote text,
  tool text NOT NULL DEFAULT 'none',
  tool_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  media_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.daily_contents TO authenticated;
GRANT SELECT ON public.daily_contents TO anon;
GRANT ALL ON public.daily_contents TO service_role;
ALTER TABLE public.daily_contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_contents_read_all" ON public.daily_contents FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "daily_contents_admin_write" ON public.daily_contents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Progress
CREATE TABLE public.user_progress (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_day integer NOT NULL DEFAULT 1,
  completed_days integer[] NOT NULL DEFAULT '{}',
  checklist_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz,
  unlock_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_progress TO authenticated;
GRANT ALL ON public.user_progress TO service_role;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progress_select" ON public.user_progress FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "progress_insert_own" ON public.user_progress FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "progress_update" ON public.user_progress FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- Journal
CREATE TABLE public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day integer,
  kind text NOT NULL DEFAULT 'journal',
  title text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_entries TO authenticated;
GRANT ALL ON public.journal_entries TO service_role;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "journal_own_all" ON public.journal_entries FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX journal_entries_user_created_idx ON public.journal_entries (user_id, created_at DESC);

-- Bootstrap current user (called by the app after sign-in)
CREATE OR REPLACE FUNCTION public.bootstrap_me()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'), u.raw_user_meta_data->>'avatar_url'
  FROM auth.users u WHERE u.id = uid
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'user') ON CONFLICT DO NOTHING;
  INSERT INTO public.user_progress (user_id) VALUES (uid) ON CONFLICT DO NOTHING;
END;
$$;
REVOKE ALL ON FUNCTION public.bootstrap_me() FROM public;
GRANT EXECUTE ON FUNCTION public.bootstrap_me() TO authenticated;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER progress_touch BEFORE UPDATE ON public.user_progress
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.daily_contents (day, week, title, technique, science, quote, tool, tool_config, checklist) VALUES
(1,1,'O primeiro passo é decidir se cuidar','Contrato de Compromisso Pessoal','Quando você escreve e assina uma decisão, o cérebro deixa de tratá-la como um pensamento passageiro e passa a registrá-la como um evento real e significativo. Isso cria um ponto de ancoragem interno: "eu decidi me cuidar". É daqui que todo o resto nasce.','Buscar melhora já é um sinal de força — não de fraqueza.','contract','{}'::jsonb,'["Ler o contrato de compromisso em voz alta, devagar","Escrever seu nome e assinar o compromisso no app","Respirar fundo três vezes ao terminar"]'::jsonb),
(2,1,'Como a ansiedade acontece no seu cérebro','Respiração do Recomeço (Suspiro Fisiológico)','A ansiedade nasce na amígdala, a estrutura que detecta ameaças. Quando ela dispara o alarme, o córtex pré-frontal — responsável por pensar com clareza e decidir — perde eficiência. Não é falta de força de vontade: é biologia. A respiração é a via mais rápida para avisar ao corpo que estamos seguros.','Entender o que acontece já é começar a mudar.','breathing','{"pattern":[{"label":"Inspire pelo nariz","secs":2},{"label":"Complete a inspiração","secs":1},{"label":"Expire pela boca","secs":6}],"cycles":3}'::jsonb,'["Ler A Ciência Por Trás com calma","Praticar a Respiração do Recomeço (3 ciclos) usando o cronômetro","Repetir a técnica uma segunda vez em um momento tranquilo do dia"]'::jsonb),
(3,1,'Voltando ao presente: 5-4-3-2-1','Ancoragem no Presente 5-4-3-2-1','Na espiral ansiosa, a mente viaja para um futuro catastrófico que ainda não aconteceu. Nomear estímulos concretos dos cinco sentidos reengaja o córtex pré-frontal e retira potência do circuito do medo, porque o cérebro não consegue catastrofizar e catalogar o presente ao mesmo tempo.','O presente é o único lugar onde você está seguro agora.','grounding','{}'::jsonb,'["Fazer a ancoragem 5-4-3-2-1 completa no app","Praticar a Respiração do Recomeço (3 ciclos)","Anotar como o corpo estava antes e depois"]'::jsonb),
(4,1,'Respiração Quadrada: dando ritmo ao sistema nervoso','Respiração Quadrada','Ciclos iguais de inspirar, segurar e expirar aumentam a variabilidade da frequência cardíaca e ativam o sistema nervoso parassimpático — o freio natural do corpo. Em poucos minutos a frequência cardíaca desacelera e o estado de alerta cai.','Ritmo lento no ar, ritmo lento na mente.','breathing','{"pattern":[{"label":"Inspire","secs":4},{"label":"Segure","secs":4},{"label":"Expire","secs":4},{"label":"Segure","secs":4}],"cycles":5}'::jsonb,'["Praticar a Respiração Quadrada (5 ciclos)","Praticar a Respiração do Recomeço em algum momento do dia","Observar em que parte do corpo a tensão aparece primeiro"]'::jsonb),
(5,1,'Brain Dump: esvaziando a mente no papel','Brain Dump','Pensamentos repetitivos ocupam a memória de trabalho e mantêm o alarme ligado. Ao escrever sem filtro por alguns minutos, você transfere essa carga para fora — o cérebro deixa de precisar segurar tudo, e a ativação emocional cai de forma medida em estudos de escrita expressiva.','Tirar de dentro é mais importante do que guardar bonito.','braindump','{"minutes":10}'::jsonb,'["Fazer 10 minutos de Brain Dump no app","Usar o botão Rasgar quando terminar, se quiser","Respiração Quadrada (5 ciclos) antes de dormir"]'::jsonb),
(6,1,'Examinando o pensamento sem brigar com ele','Examinando o Pensamento','Pensamentos ansiosos se apresentam como fatos. Examiná-los — evidências a favor, contra e uma leitura equilibrada — recruta o córtex pré-frontal e enfraquece a associação automática entre pensamento e alarme.','Um pensamento examinado por dia já é muito.','journal','{"prompts":["Qual é o pensamento?","Qual a evidência de que ele é verdade?","Qual a evidência contra?","Qual seria uma visão mais equilibrada?"]}'::jsonb,'["Escolher um pensamento e examiná-lo no app","Praticar a Respiração do Recomeço (3 ciclos)","Reler o que escreveu antes de dormir"]'::jsonb),
(7,1,'Semana 1: consolidando a base','Respiração do Recomeço (Suspiro Fisiológico)','Repetição é o que transforma técnica em reflexo. Cada vez que você regula a respiração de forma consciente, fortalece um caminho neural que ficará disponível automaticamente quando a ansiedade aparecer.','O progresso não precisa ser rápido para ser real.','breathing','{"pattern":[{"label":"Inspire pelo nariz","secs":2},{"label":"Complete a inspiração","secs":1},{"label":"Expire pela boca","secs":6}],"cycles":3}'::jsonb,'["Revisar as técnicas da semana","Praticar a Respiração do Recomeço (3 ciclos)","Escrever uma frase sobre o que mudou nesses 7 dias"]'::jsonb),
(8,2,'O que é uma crise de pânico','Reflexo do Mergulho (Água Fria)','A crise de pânico é um alarme falso disparado com força máxima: adrenalina, coração acelerado, falta de ar. É intensa, mas tem curva — sobe, atinge o pico em torno de 10 minutos e desce. Água fria no rosto ativa o reflexo do mergulho, que reduz a frequência cardíaca em segundos por via vagal.','O que você sente é o corpo tentando te proteger. Ele não vai te machucar.','dive','{}'::jsonb,'["Ler sobre a Curva do Pânico","Praticar o Reflexo do Mergulho com água fria","Guardar mentalmente onde ficam as ferramentas de SOS do app"]'::jsonb),
(9,2,'Surfar a onda em vez de lutar contra ela','Surfar a Onda','Lutar contra a crise adiciona medo ao medo e prolonga a descarga de adrenalina. Observar as sensações como uma onda que sobe e desce ensina o cérebro que aquilo passa sozinho — é o mecanismo central da extinção do medo.','Você não precisa fazer parar. Só precisa atravessar.','surf','{"minutes":10}'::jsonb,'["Ler o passo a passo de Surfar a Onda","Usar o guia visual de onda por pelo menos 3 minutos","Praticar a Respiração do Recomeço (3 ciclos)"]'::jsonb),
(10,2,'Os sintomas físicos são reais — e explicáveis','Mapeamento de Crises','Coração acelerado leva sangue aos músculos. Tontura é redistribuição de fluxo. Formigamento é o sistema nervoso em alerta máximo. Sensação de irrealidade é sobrecarga de informação. Nomear a função de cada sintoma retira dele o significado de catástrofe.','Nomear o que acontece diminui o tamanho do medo.','journal','{"prompts":["Onde você estava e o que aconteceu antes?","Quais sinais o corpo deu primeiro?","O que ajudou a atravessar?"]}'::jsonb,'["Ler a lista de sintomas e suas funções","Mapear uma crise passada no diário","Respiração Quadrada (5 ciclos)"]'::jsonb),
(11,2,'Regulação diária pelo nervo vago','Regulação pelo Nervo Vago','O nervo vago conecta cérebro e órgãos e comanda o estado de calma. Expirações longas, som e vibração aumentam o tônus vagal — quanto melhor esse tônus, mais rápido o corpo volta ao normal depois de um susto.','Treinar a calma nos dias bons é o que a torna acessível nos dias difíceis.','breathing','{"pattern":[{"label":"Inspire suave","secs":4},{"label":"Expire longo com som","secs":8}],"cycles":8}'::jsonb,'["Praticar a regulação vagal (8 ciclos) no app","Cantarolar ou fazer vvv por 1 minuto","Anotar como ficou o corpo depois"]'::jsonb),
(12,2,'Exposição interoceptiva: ensinando o corpo','Exposição Interoceptiva','Quem tem pânico aprende a temer as próprias sensações corporais. Provocar sensações parecidas de forma segura e controlada — e ver que nada acontece — reduz a interpretação de perigo. É exposição, o tratamento com maior evidência para pânico.','Se tiver alguma condição cardíaca, converse com seu médico antes.','journal','{"prompts":["Qual sensação você treinou hoje?","De 0 a 10, quanto de medo ela trouxe no começo?","E no fim?"]}'::jsonb,'["Ler as precauções da técnica","Fazer um exercício curto de exposição interoceptiva","Registrar o nível de medo antes e depois"]'::jsonb),
(13,2,'Seu plano de crise pessoal','Mapeamento de Crises','Em crise, a capacidade de decidir cai. Ter um plano escrito e treinado antes transfere a decisão para um momento em que o córtex pré-frontal está funcionando — você só executa.','Plano pronto é uma forma de gentileza com o seu eu futuro.','journal','{"prompts":["Meus 3 passos, na ordem que vou usar","Quem eu aviso ou chamo, se precisar","Onde deixo água fria e o app acessível"]}'::jsonb,'["Escrever seu plano: 3 passos na ordem que vai usar","Praticar o Reflexo do Mergulho uma vez","Respiração do Recomeço (3 ciclos)"]'::jsonb),
(14,2,'Semana 2: o pânico perde poder','Respiração Coerente','A respiração coerente (cerca de 6 respirações por minuto) sincroniza coração e respiração, melhorando a variabilidade cardíaca — marcador de flexibilidade do sistema nervoso e de melhor recuperação após o estresse.','Você atravessou. Isso conta.','breathing','{"pattern":[{"label":"Inspire","secs":5},{"label":"Expire","secs":5}],"cycles":12}'::jsonb,'["Praticar Respiração Coerente por 5 minutos","Revisar as técnicas de pânico da semana","Escrever o que ficou mais fácil"]'::jsonb),
(15,3,'O que a depressão faz no cérebro','Registro dos 3 Momentos','A depressão não é preguiça nem fraqueza: envolve alterações reais em serotonina, dopamina e norepinefrina, além de queda de atividade em circuitos de recompensa. Registrar três momentos concretos do dia reativa a atenção a estímulos positivos, que a depressão filtra para fora.','A depressão mente sobre você. A ciência ajuda a ver isso.','journal','{"prompts":["Um momento neutro ou bom de hoje","Algo que você fez, mesmo pequeno","Algo pelo qual sente um mínimo de gratidão"]}'::jsonb,'["Ler sobre os neurotransmissores envolvidos","Fazer o Registro dos 3 Momentos no diário","Respiração Coerente por 5 minutos"]'::jsonb),
(16,3,'Na depressão, a ação vem antes da vontade','Passos Ridiculamente Pequenos','Esperar sentir vontade não funciona porque o circuito de motivação está prejudicado. O movimento mínimo libera dopamina e cria a sensação de conquista, que gera mais motivação. O ciclo virtuoso começa pela menor ação possível.','Não existe passo pequeno demais.','steps','{"prompts":["Qual é o passo tão pequeno que é quase impossível não fazer?","Feito? Como foi?"]}'::jsonb,'["Escolher um passo ridiculamente pequeno","Executar esse passo hoje","Registrar como foi, sem julgamento"]'::jsonb),
(17,3,'O Tribunal dos Pensamentos','Tribunal dos Pensamentos','A autocrítica depressiva se apresenta como verdade absoluta. Colocar o pensamento no banco dos réus — provas a favor, provas contra, veredito — treina o cérebro a avaliar em vez de aceitar, reduzindo a ruminação.','Você não é seu pior pensamento.','tribunal','{"prompts":["A acusação (o pensamento)","Provas a favor","Provas contra","Veredito equilibrado"]}'::jsonb,'["Levar um pensamento ao Tribunal no app","Ler o veredito em voz alta","Passo ridiculamente pequeno do dia"]'::jsonb),
(18,3,'Desfusão: você não é o pensamento','Desfusão Cognitiva','Desfusão cognitiva muda a relação com o pensamento em vez do conteúdo dele. Ao dizer "estou percebendo o pensamento de que...", a mente passa a observar de fora, e a carga emocional cai sem precisar discutir com o pensamento.','Pensamentos são eventos mentais, não ordens.','journal','{"prompts":["Escreva o pensamento","Agora reescreva: Estou percebendo o pensamento de que...","O que mudou ao ler assim?"]}'::jsonb,'["Praticar a desfusão com um pensamento pesado","Registrar o que mudou ao reformular","Movimento rítmico por 5 minutos, se possível"]'::jsonb),
(19,3,'Movimento rítmico para sair do torpor','Movimento Rítmico','Movimento repetitivo e ritmado — caminhar, pedalar, balançar — aumenta serotonina e norepinefrina e ajuda a sair do estado de anestesia emocional. Não é sobre exercício intenso: é sobre ritmo.','O corpo em movimento ensina a mente que algo pode mudar.','timer','{"minutes":10}'::jsonb,'["10 minutos de movimento rítmico com o cronômetro","Registro dos 3 Momentos","Respiração Coerente antes de dormir"]'::jsonb),
(20,3,'Rotina mínima viável','Passos Ridiculamente Pequenos','Previsibilidade reduz carga cognitiva. Uma rotina mínima — horários âncora de acordar, comer, mover e dormir — estabiliza o ritmo circadiano, que está diretamente ligado ao humor.','Estrutura simples cansa menos que improviso.','steps','{"prompts":["Minhas 3 âncoras do dia","Qual delas foi mais fácil hoje?"]}'::jsonb,'["Definir 3 âncoras simples do seu dia","Cumprir pelo menos uma hoje","Anotar qual foi mais fácil"]'::jsonb),
(21,3,'Semana 3: gentileza que sustenta','Registro dos 3 Momentos','Autocompaixão não é indulgência: estudos mostram que ela reduz cortisol e melhora a adesão a mudanças de comportamento. Cobrança dura ativa ameaça; cuidado ativa o sistema de calma.','Você merece cuidado — inclusive o seu.','journal','{"prompts":["Um momento neutro ou bom de hoje","Algo que você fez, mesmo pequeno","Uma frase de cuidado para você mesmo"]}'::jsonb,'["Reler seus registros da semana","Escrever 3 momentos de hoje","Escrever uma frase de cuidado para si mesmo"]'::jsonb),
(22,4,'Integrando: o que já funciona para você','Respiração do Recomeço (Suspiro Fisiológico)','Personalização aumenta adesão. Identificar quais técnicas funcionam no seu corpo transforma um conjunto de exercícios em um repertório próprio, acessível sob estresse.','Seu método é o que funciona para você.','breathing','{"pattern":[{"label":"Inspire pelo nariz","secs":2},{"label":"Complete a inspiração","secs":1},{"label":"Expire pela boca","secs":6}],"cycles":3}'::jsonb,'["Listar as 3 técnicas que mais te ajudaram","Praticar uma delas hoje","Respiração do Recomeço (3 ciclos)"]'::jsonb),
(23,4,'Gatilhos: reconhecer sem temer','Examinando o Pensamento','Identificar gatilhos antecipa a resposta e devolve senso de controle. Não é evitar tudo — é conhecer o mapa para escolher a ferramenta certa no momento certo.','Conhecer o gatilho é diferente de fugir dele.','journal','{"prompts":["Meus 3 gatilhos mais frequentes","Qual técnica combina com cada um?","Um pensamento ligado a esses gatilhos, examinado"]}'::jsonb,'["Listar 3 gatilhos frequentes","Escolher uma técnica para cada um","Examinar um pensamento ligado a um deles"]'::jsonb),
(24,4,'Evitação: o combustível silencioso','Surfar a Onda','Cada esquiva alivia no curto prazo e reforça o medo no longo prazo. Aproximar-se um passo — pequeno, escolhido por você — é o que reduz a ansiedade de forma duradoura.','Um passo em direção ao que assusta vale por dez explicações.','surf','{"minutes":10}'::jsonb,'["Escolher uma pequena evitação para enfrentar","Usar Surfar a Onda durante o desconforto","Registrar o resultado"]'::jsonb),
(25,4,'Sono, corpo e humor','Respiração Coerente','Privação de sono aumenta a reatividade da amígdala e reduz o controle pré-frontal. Cuidar do sono é intervenção direta na regulação emocional.','Dormir melhor é tratamento, não luxo.','breathing','{"pattern":[{"label":"Inspire","secs":5},{"label":"Expire","secs":5}],"cycles":12}'::jsonb,'["Definir um horário de dormir realista","Respiração Coerente por 5 minutos na cama","Sem telas nos 20 minutos finais, se possível"]'::jsonb),
(26,4,'Mudando a relação com a memória difícil','Mudando a Relação com a Memória','A memória não é um arquivo fixo: ao ser recordada, ela se torna momentaneamente maleável e é regravada com o contexto atual. Não se trata de apagar o passado, mas de mudar a relação com ele.','O passado não muda. A relação com ele, sim.','journal','{"prompts":["Descreva a lembrança em 3 linhas, como se contasse a um amigo","O que você sabe hoje que não sabia lá?","Que frase de cuidado você diria para aquela versão de você?"]}'::jsonb,'["Fazer o exercício de reprocessamento no diário","Escrever uma frase de cuidado para o você do passado","Respiração do Recomeço (3 ciclos)"]'::jsonb),
(27,4,'Rede de apoio','Registro dos 3 Momentos','Contato social seguro libera ocitocina e reduz a resposta ao estresse. Apoio social é um dos preditores mais fortes de recuperação em ansiedade e depressão.','Pedir ajuda é um ato de coragem.','journal','{"prompts":["3 pessoas ou serviços de apoio","Para quem eu mando uma mensagem hoje?","Como foi o contato?"]}'::jsonb,'["Escrever 3 pessoas ou serviços de apoio","Enviar uma mensagem para alguém hoje","Registro dos 3 Momentos"]'::jsonb),
(28,4,'Prevenindo recaídas com gentileza','Tribunal dos Pensamentos','Dias ruins voltam — isso é esperado e não apaga o progresso. Ter um plano de recaída reduz o efeito tudo ou nada, principal responsável por abandonos.','Recaída não é retorno ao começo.','tribunal','{"prompts":["A acusação (voltei à estaca zero)","Provas a favor","Provas contra","Veredito equilibrado"]}'::jsonb,'["Escrever seus 3 primeiros sinais de piora","Definir a primeira ação ao notá-los","Levar ao Tribunal o pensamento voltei à estaca zero"]'::jsonb),
(29,4,'Seu kit de emergência definitivo','Reflexo do Mergulho (Água Fria)','Automatizar a resposta é o objetivo final: quando as técnicas estão treinadas, o corpo executa antes de a mente entrar em pânico sobre o pânico.','Preparo silencioso, resposta rápida.','dive','{}'::jsonb,'["Montar seu kit: 3 técnicas na ordem de uso","Praticar o Reflexo do Mergulho","Salvar o app na tela inicial do celular"]'::jsonb),
(30,4,'Continuar — no seu ritmo','Respiração Coerente','Neuroplasticidade não tem data de término: cada prática continua remodelando circuitos. O plano acaba, o repertório permanece — e a biblioteca fica disponível sempre que precisar.','Você tem tudo o que precisa. Continue no seu ritmo.','breathing','{"pattern":[{"label":"Inspire","secs":5},{"label":"Expire","secs":5}],"cycles":12}'::jsonb,'["Reler seu contrato de compromisso do Dia 1","Escrever uma carta curta para você mesmo","Respiração Coerente por 5 minutos"]'::jsonb);