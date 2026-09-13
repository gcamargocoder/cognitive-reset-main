import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Pause, Play, RotateCcw, Save, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { JOURNAL_TEXT_MAX_LENGTH } from "@/lib/validation";
import { ToolErrorBoundary } from "@/components/tools/tool-error-boundary";
import type { Technique } from "@/lib/library";

type Phase = { label: string; secs: number };

export function useJournalSave(kind: string, title: string, day?: number | undefined) {
  const [saving, setSaving] = useState(false);
  const save = async (content: Record<string, unknown>) => {
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setSaving(false);
      toast.error("Faça login para salvar no diário.");
      return;
    }
    const { error } = await supabase.from("journal_entries").insert({
      user_id: auth.user.id,
      kind,
      title,
      day: day ?? null,
      content: content as never,
    });
    setSaving(false);
    if (error) toast.error("Não foi possível salvar agora.");
    else toast.success("Salvo no seu diário.");
  };
  return { save, saving };
}

function BreathingTool({ pattern, cycles }: { pattern: Phase[]; cycles: number }) {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [cycle, setCycle] = useState(1);
  const [left, setLeft] = useState(pattern[0]?.secs ?? 4);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setLeft((prev) => {
        if (prev > 1) return prev - 1;
        const nextPhase = (phase + 1) % pattern.length;
        if (nextPhase === 0) {
          if (cycle >= cycles) {
            setRunning(false);
            toast.success("Prática concluída. Perceba como o corpo está agora.");
            return pattern[0]!.secs;
          }
          setCycle((c) => c + 1);
        }
        setPhase(nextPhase);
        return pattern[nextPhase]!.secs;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, phase, cycle, cycles, pattern]);

  const current = pattern[phase]!;

  return (
    <Card className="border-primary/20">
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="font-display text-3xl font-black uppercase tracking-wide text-primary sm:text-4xl">
          {current.label}
        </p>
        <span className="font-display text-8xl font-black leading-none sm:text-9xl">{left}</span>
        <p className="text-sm text-muted-foreground">
          Ciclo {cycle} de {cycles}
        </p>
        <div className="grid w-full grid-cols-2 gap-2">
          <Button size="lg" onClick={() => setRunning((r) => !r)} className="tap-scale">
            {running ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {running ? "Pausar" : "Começar"}
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => {
              setRunning(false);
              setPhase(0);
              setCycle(1);
              setLeft(pattern[0]!.secs);
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reiniciar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const GROUNDING = [
  { count: 5, label: "coisas que você VÊ" },
  { count: 4, label: "coisas que você pode TOCAR" },
  { count: 3, label: "sons que você OUVE" },
  { count: 2, label: "cheiros que você percebe" },
  { count: 1, label: "sabor que você sente ou deseja" },
];

function GroundingTool({ day }: { day?: number | undefined }) {
  const [values, setValues] = useState<string[][]>(GROUNDING.map((g) => Array(g.count).fill("")));
  const { save, saving } = useJournalSave("grounding", "Ancoragem 5-4-3-2-1", day);
  const filled = values.flat().filter((v) => v.trim()).length;
  const total = values.flat().length;

  return (
    <Card>
      <CardContent className="space-y-5 py-6">
        <Progress value={(filled / total) * 100} />
        {GROUNDING.map((group, gi) => (
          <div key={group.label} className="space-y-2">
            <Label className="text-sm font-semibold">
              {group.count} {group.label}
            </Label>
            {values[gi]!.map((value, vi) => (
              <Input
                key={vi}
                value={value}
                placeholder={`${vi + 1}...`}
                onChange={(e) =>
                  setValues((prev) =>
                    prev.map((row, ri) =>
                      ri === gi ? row.map((v, i) => (i === vi ? e.target.value : v)) : row,
                    ),
                  )
                }
              />
            ))}
          </div>
        ))}
        <Button
          size="lg"
          className="w-full tap-scale"
          disabled={saving || filled === 0}
          onClick={() =>
            save(Object.fromEntries(GROUNDING.map((g, i) => [g.label, values[i]!.filter(Boolean)])))
          }
        >
          <Save className="mr-2 h-4 w-4" />
          Salvar no diário
        </Button>
      </CardContent>
    </Card>
  );
}

function BrainDumpTool({ minutes, day }: { minutes: number; day?: number | undefined }) {
  const [text, setText] = useState("");
  const [left, setLeft] = useState(minutes * 60);
  const [running, setRunning] = useState(false);
  const { save, saving } = useJournalSave("braindump", "Descarga Mental", day);

  useEffect(() => {
    if (!running || left <= 0) return;
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(id);
  }, [running, left]);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        <div className="flex items-center justify-between">
          <span className="font-display text-3xl">
            {mm}:{ss}
          </span>
          <Button size="lg" variant="secondary" onClick={() => setRunning((r) => !r)}>
            {running ? "Pausar" : "Iniciar tempo"}
          </Button>
        </div>
        <Textarea
          rows={10}
          value={text}
          maxLength={JOURNAL_TEXT_MAX_LENGTH}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva tudo que vier à cabeça, sem organizar, sem corrigir, sem julgar..."
        />
        <Button
          size="lg"
          className="w-full tap-scale"
          disabled={saving || !text.trim()}
          onClick={() => save({ text })}
        >
          <Save className="mr-2 h-4 w-4" />
          Salvar no diário
        </Button>
      </CardContent>
    </Card>
  );
}

function PromptsTool({
  prompts,
  kind,
  title,
  day,
}: {
  prompts: string[];
  kind: string;
  title: string;
  day?: number | undefined;
}) {
  const [answers, setAnswers] = useState<string[]>(prompts.map(() => ""));
  const { save, saving } = useJournalSave(kind, title, day);

  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        {prompts.map((prompt, i) => (
          <div key={prompt} className="space-y-2">
            <Label className="text-sm font-semibold">{prompt}</Label>
            <Textarea
              rows={3}
              value={answers[i]}
              maxLength={JOURNAL_TEXT_MAX_LENGTH}
              onChange={(e) =>
                setAnswers((prev) => prev.map((a, ai) => (ai === i ? e.target.value : a)))
              }
            />
          </div>
        ))}
        <Button
          size="lg"
          className="w-full tap-scale"
          disabled={saving || answers.every((a) => !a.trim())}
          onClick={() => save(Object.fromEntries(prompts.map((p, i) => [p, answers[i]])))}
        >
          <Save className="mr-2 h-4 w-4" />
          Salvar no diário
        </Button>
      </CardContent>
    </Card>
  );
}

function TimerTool({ minutes }: { minutes: number }) {
  const [left, setLeft] = useState(minutes * 60);
  const [running, setRunning] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          setRunning(false);
          if (!doneRef.current) {
            doneRef.current = true;
            toast.success("Tempo concluído. Você se movimentou hoje.");
          }
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-8">
        <span className="font-display text-5xl">
          {String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}
        </span>
        <Progress className="w-full" value={100 - (left / (minutes * 60)) * 100} />
        <div className="grid w-full grid-cols-2 gap-2">
          <Button size="lg" onClick={() => setRunning((r) => !r)} className="tap-scale">
            {running ? "Pausar" : "Começar"}
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => {
              setRunning(false);
              doneRef.current = false;
              setLeft(minutes * 60);
            }}
          >
            Reiniciar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const DIVE_STEPS = [
  "Encha uma bacia ou a pia com água bem fria — se tiver gelo, ainda melhor.",
  "Respire fundo uma vez e prenda o ar por um instante.",
  "Mergulhe o rosto na água por 15 a 30 segundos — ou passe água gelada nas têmporas, no pescoço e nos pulsos.",
  "Levante devagar, respire normalmente e repita mais uma vez se ainda precisar.",
];

function DiveTool() {
  const [step, setStep] = useState(0);
  const [hold, setHold] = useState(30);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setHold((h) => {
        if (h <= 1) {
          setRunning(false);
          return 0;
        }
        return h - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        <ol className="space-y-2">
          {DIVE_STEPS.map((text, i) => (
            <li
              key={text}
              className={`rounded-xl border p-3 text-sm ${i === step ? "border-primary bg-primary-soft/60" : "border-border"}`}
            >
              {text}
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            size="lg"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => setStep((s) => Math.min(DIVE_STEPS.length - 1, s + 1))}
          >
            Próximo passo
          </Button>
          <div className="flex items-center justify-between gap-2 sm:justify-start">
            <span className="font-display text-2xl">{hold}s</span>
            <Button
              size="lg"
              onClick={() => {
                setHold(30);
                setRunning(true);
              }}
            >
              Contar mergulho
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Não use esta técnica se você tem condição cardíaca sem liberação médica.
        </p>
      </CardContent>
    </Card>
  );
}

function SurfTool() {
  const [level, setLevel] = useState(5);
  const [note, setNote] = useState("");
  const { save, saving } = useJournalSave("surf", "Surfar a Onda");

  return (
    <Card>
      <CardContent className="space-y-5 py-6">
        <p className="rounded-2xl border border-border/60 bg-card/60 p-4 text-center text-sm text-muted-foreground">
          A crise sobe, atinge o pico e desce. Você não precisa fazer nada além de respirar.
        </p>
        <div className="space-y-2">
          <Label>Intensidade agora: {level}/10</Label>
          <input
            type="range"
            min={0}
            max={10}
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="w-full accent-[var(--primary)]"
          />
        </div>
        <Textarea
          rows={3}
          value={note}
          maxLength={JOURNAL_TEXT_MAX_LENGTH}
          placeholder="Descreva a sensação como um observador: 'sinto o peito apertado e isso está passando'."
          onChange={(e) => setNote(e.target.value)}
        />
        <Button
          size="lg"
          className="w-full tap-scale"
          disabled={saving}
          onClick={() => save({ level, note })}
        >
          <Save className="mr-2 h-4 w-4" />
          Registrar a onda
        </Button>
      </CardContent>
    </Card>
  );
}

export type ContractStatus = { name: string; commitments: string[]; signedAt: string };

const CONTRACT_LABELS = [
  "Vou praticar pelo menos uma técnica por dia.",
  "Vou tratar recaídas como parte do processo, não como fracasso.",
  "Vou pedir ajuda profissional se precisar.",
  "Vou falar comigo com o cuidado que ofereço a quem amo.",
];

function ContractTool({
  signed,
  onSign,
}: {
  signed: ContractStatus | null | undefined;
  onSign: (data: { name: string; commitments: string[] }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [commitments, setCommitments] = useState([false, false, false, false]);
  const { save } = useJournalSave("contract", "Contrato de Compromisso");
  const [saving, setSaving] = useState(false);

  if (signed) {
    return (
      <Card className="border-mint bg-mint/20">
        <CardContent className="space-y-3 py-6">
          <div className="flex items-center gap-2 text-mint-foreground">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint">
              <Check className="h-4 w-4" strokeWidth={2.6} />
            </span>
            <span className="font-semibold">Assinado / Concluído</span>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {signed.commitments.map((label) => (
              <li key={label} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-mint-foreground" />
                <span>{label}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm">
            Assinado por <strong>{signed.name}</strong>.
          </p>
        </CardContent>
      </Card>
    );
  }

  const submit = async () => {
    setSaving(true);
    try {
      await onSign({ name, commitments: CONTRACT_LABELS });
      await save({ name, commitments: CONTRACT_LABELS });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `Não foi possível salvar o contrato: ${error.message}`
          : "Não foi possível salvar o contrato agora.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        {CONTRACT_LABELS.map((label, i) => (
          <label key={label} className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={commitments[i] ?? false}
              onCheckedChange={(v) =>
                setCommitments((prev) => prev.map((c, ci) => (ci === i ? Boolean(v) : c)))
              }
            />
            <span>{label}</span>
          </label>
        ))}
        <div className="space-y-2">
          <Label>Assine com seu nome</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
        </div>
        <Button
          size="lg"
          className="w-full tap-scale"
          disabled={saving || !name.trim() || commitments.some((c) => !c)}
          onClick={submit}
        >
          <Check className="mr-2 h-4 w-4" />
          Assinar compromisso
        </Button>
      </CardContent>
    </Card>
  );
}

const MUSCLE_GROUPS = [
  "Mãos e antebraços",
  "Braços e ombros",
  "Rosto e mandíbula",
  "Barriga",
  "Pernas e pés",
];

function PmrTool() {
  const [group, setGroup] = useState(0);
  const [tensing, setTensing] = useState(true);
  const [left, setLeft] = useState(5);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [feltBetter, setFeltBetter] = useState<boolean | null>(null);
  const { save, saving } = useJournalSave("irritability_pause", "Relaxamento Muscular Progressivo");

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setLeft((prev) => {
        if (prev > 1) return prev - 1;
        if (tensing) {
          setTensing(false);
          return 10;
        }
        if (group >= MUSCLE_GROUPS.length - 1) {
          setRunning(false);
          setDone(true);
          return 0;
        }
        setGroup((g) => g + 1);
        setTensing(true);
        return 5;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, tensing, group]);

  if (done) {
    return (
      <Card>
        <CardContent className="space-y-4 py-8 text-center">
          <p className="text-base font-medium">Como está o corpo agora?</p>
          <div className="flex justify-center gap-3">
            <Button
              size="lg"
              variant={feltBetter === true ? "default" : "outline"}
              onClick={() => setFeltBetter(true)}
            >
              <ThumbsUp className="mr-2 h-4 w-4" /> Mais leve
            </Button>
            <Button
              size="lg"
              variant={feltBetter === false ? "default" : "outline"}
              onClick={() => setFeltBetter(false)}
            >
              <ThumbsDown className="mr-2 h-4 w-4" /> Ainda tenso
            </Button>
          </div>
          <Button
            size="lg"
            className="w-full tap-scale"
            disabled={saving || feltBetter === null}
            onClick={() => save({ technique: "pmr", feltBetter })}
          >
            <Save className="mr-2 h-4 w-4" />
            Concluir
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="font-display text-2xl font-black uppercase tracking-wide text-primary sm:text-3xl">
          {tensing ? "Tensione" : "Solte e relaxe"}
        </p>
        <p className="text-base font-semibold">{MUSCLE_GROUPS[group]}</p>
        <span className="font-display text-8xl font-black leading-none sm:text-9xl">{left}</span>
        <p className="text-sm text-muted-foreground">
          Grupo {group + 1} de {MUSCLE_GROUPS.length}
        </p>
        <Button size="lg" onClick={() => setRunning((r) => !r)} className="tap-scale">
          {running ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
          {running ? "Pausar" : "Começar"}
        </Button>
      </CardContent>
    </Card>
  );
}

const SOMATIC_STEPS = [
  "Sem mover a cabeça, amplie o campo de visão até notar as bordas do ambiente ao redor.",
  "Nomeie, mentalmente, 3 pontos fixos que você consegue ver sem mover a cabeça.",
  "Perceba o peso do corpo apoiado — os pés no chão ou o corpo na cadeira.",
  "Alongue a expiração por alguns ciclos, mais longa do que a inspiração.",
];

function SomaticScanTool() {
  const totalSecs = 180;
  const [left, setLeft] = useState(totalSecs);
  const [running, setRunning] = useState(false);
  const [feltBetter, setFeltBetter] = useState<boolean | null>(null);
  const { save, saving } = useJournalSave("irritability_pause", "Visão Panorâmica Somática");
  const stepIndex = Math.min(
    SOMATIC_STEPS.length - 1,
    Math.floor(((totalSecs - left) / totalSecs) * SOMATIC_STEPS.length),
  );

  useEffect(() => {
    if (!running || left <= 0) return;
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(id);
  }, [running, left]);

  const done = left === 0;

  return (
    <Card>
      <CardContent className="space-y-5 py-6">
        <div className="flex items-center justify-between">
          <span className="font-display text-3xl">
            {String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}
          </span>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => setRunning((r) => !r)}
            disabled={done}
          >
            {running ? "Pausar" : "Começar"}
          </Button>
        </div>
        <Progress value={100 - (left / totalSecs) * 100} />
        <p className="rounded-2xl border border-primary/30 bg-primary-soft/40 p-4 text-sm leading-relaxed">
          {SOMATIC_STEPS[stepIndex]}
        </p>
        {done ? (
          <>
            <p className="text-sm font-medium">O campo de visão se abriu um pouco?</p>
            <div className="flex justify-center gap-3">
              <Button
                size="lg"
                variant={feltBetter === true ? "default" : "outline"}
                onClick={() => setFeltBetter(true)}
              >
                <ThumbsUp className="mr-2 h-4 w-4" /> Sim
              </Button>
              <Button
                size="lg"
                variant={feltBetter === false ? "default" : "outline"}
                onClick={() => setFeltBetter(false)}
              >
                <ThumbsDown className="mr-2 h-4 w-4" /> Ainda não
              </Button>
            </div>
            <Button
              size="lg"
              className="w-full tap-scale"
              disabled={saving || feltBetter === null}
              onClick={() => save({ technique: "somatic-scan", feltBetter })}
            >
              <Save className="mr-2 h-4 w-4" />
              Concluir
            </Button>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

const TRIGGER_TAGS = ["Trabalho", "Trânsito", "Família", "Cansaço", "Redes sociais"];
const SENSATION_TAGS = [
  "Mandíbula travada",
  "Mãos quentes",
  "Respiração curta",
  "Coração acelerado",
  "Punhos fechados",
];
const ACTION_OPTIONS = [
  "Falar usando 'eu sinto...' em vez de acusar",
  "Pedir uma pausa antes de continuar a conversa",
  "Escrever a resposta e reler antes de enviar",
  "Pedir ajuda a alguém de confiança",
];
const ISOLATION_OPTIONS = ["Sem isolamento", "10 minutos", "20 minutos", "30 minutos"];

function toggleInArray<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function EscalationDiaryTool() {
  const [step, setStep] = useState(0);
  const [trigger, setTrigger] = useState<string[]>([]);
  const [triggerOther, setTriggerOther] = useState("");
  const [sensations, setSensations] = useState<string[]>([]);
  const [automaticThought, setAutomaticThought] = useState("");
  const [neutralReframe, setNeutralReframe] = useState("");
  const [action, setAction] = useState<string | null>(null);
  const [isolation, setIsolation] = useState<string | null>(null);
  const { save, saving } = useJournalSave("irritability_diary", "Diário de Desescalada");

  const canAdvance = [
    trigger.length > 0 || triggerOther.trim().length > 0,
    sensations.length > 0,
    automaticThought.trim().length > 0 && neutralReframe.trim().length > 0,
    action !== null,
  ];

  const submit = () =>
    save({
      trigger: [...trigger, ...(triggerOther.trim() ? [triggerOther.trim()] : [])],
      sensations,
      automaticThought,
      neutralReframe,
      action,
      isolationMinutes: isolation,
    });

  return (
    <Card>
      <CardContent className="space-y-5 py-6">
        <Progress value={((step + 1) / 4) * 100} />

        {step === 0 ? (
          <div className="space-y-3">
            <Label className="text-sm font-semibold">O que disparou a irritação?</Label>
            <div className="flex flex-wrap gap-2">
              {TRIGGER_TAGS.map((tag) => (
                <Button
                  key={tag}
                  type="button"
                  size="sm"
                  variant={trigger.includes(tag) ? "default" : "outline"}
                  onClick={() => setTrigger((prev) => toggleInArray(prev, tag))}
                >
                  {tag}
                </Button>
              ))}
            </div>
            <Input
              placeholder="Outro motivo (opcional)"
              value={triggerOther}
              onChange={(e) => setTriggerOther(e.target.value)}
            />
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-3">
            <Label className="text-sm font-semibold">O que o corpo sentiu?</Label>
            {SENSATION_TAGS.map((tag) => (
              <label key={tag} className="flex items-center gap-3 text-sm">
                <Checkbox
                  checked={sensations.includes(tag)}
                  onCheckedChange={() => setSensations((prev) => toggleInArray(prev, tag))}
                />
                <span>{tag}</span>
              </label>
            ))}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Qual foi o pensamento automático (hostil)?
              </Label>
              <Textarea
                rows={3}
                maxLength={JOURNAL_TEXT_MAX_LENGTH}
                value={automaticThought}
                placeholder="Ex.: 'Ele fez isso de propósito para me atrapalhar.'"
                onChange={(e) => setAutomaticThought(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Qual seria uma interpretação mais neutra?
              </Label>
              <Textarea
                rows={3}
                maxLength={JOURNAL_TEXT_MAX_LENGTH}
                value={neutralReframe}
                placeholder="Ex.: 'Talvez ele não tenha percebido o impacto disso agora.'"
                onChange={(e) => setNeutralReframe(e.target.value)}
              />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Qual ação assertiva você escolhe?</Label>
              <div className="grid gap-2">
                {ACTION_OPTIONS.map((opt) => (
                  <Button
                    key={opt}
                    type="button"
                    className="h-auto w-full justify-start whitespace-normal text-left"
                    variant={action === opt ? "default" : "outline"}
                    onClick={() => setAction(opt)}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Tempo de isolamento saudável</Label>
              <div className="flex flex-wrap gap-2">
                {ISOLATION_OPTIONS.map((opt) => (
                  <Button
                    key={opt}
                    type="button"
                    size="sm"
                    variant={isolation === opt ? "default" : "outline"}
                    onClick={() => setIsolation(opt)}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            size="lg"
            variant="ghost"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Voltar
          </Button>
          {step < 3 ? (
            <Button
              type="button"
              size="lg"
              disabled={!canAdvance[step]}
              onClick={() => setStep((s) => s + 1)}
            >
              Próximo
            </Button>
          ) : (
            <Button
              size="lg"
              disabled={saving || !canAdvance[3]}
              onClick={submit}
              className="tap-scale"
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar no diário
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ToolRenderer({
  technique,
  day,
  contractStatus,
  onSignContract,
}: {
  technique: Technique;
  day?: number | undefined;
  contractStatus?: ContractStatus | null | undefined;
  onSignContract?: (data: { name: string; commitments: string[] }) => Promise<void>;
}) {
  const config = (technique.toolConfig ?? {}) as {
    pattern?: Phase[];
    cycles?: number;
    minutes?: number;
    prompts?: string[];
  };
  const prompts = useMemo(() => config.prompts ?? [], [config.prompts]);

  return (
    <ToolErrorBoundary key={technique.slug}>
      {renderTool(technique, config, prompts, day, contractStatus, onSignContract)}
    </ToolErrorBoundary>
  );
}

function renderTool(
  technique: Technique,
  config: { pattern?: Phase[]; cycles?: number; minutes?: number },
  prompts: string[],
  day: number | undefined,
  contractStatus?: ContractStatus | null | undefined,
  onSignContract?: (data: { name: string; commitments: string[] }) => Promise<void>,
) {
  switch (technique.tool) {
    case "breathing":
      return (
        <BreathingTool
          pattern={config.pattern ?? [{ label: "Inspire", secs: 4 }]}
          cycles={config.cycles ?? 5}
        />
      );
    case "grounding":
      return <GroundingTool day={day} />;
    case "braindump":
      return <BrainDumpTool minutes={config.minutes ?? 10} day={day} />;
    case "timer":
      return <TimerTool minutes={config.minutes ?? 10} />;
    case "dive":
      return <DiveTool />;
    case "surf":
      return <SurfTool />;
    case "contract":
      return <ContractTool signed={contractStatus} onSign={onSignContract ?? (async () => {})} />;
    case "pmr":
      return <PmrTool />;
    case "somatic-scan":
      return <SomaticScanTool />;
    case "escalation-diary":
      return <EscalationDiaryTool />;
    case "journal":
    case "tribunal":
    case "steps":
      return (
        <PromptsTool prompts={prompts} kind={technique.tool} title={technique.name} day={day} />
      );
    default:
      return null;
  }
}
