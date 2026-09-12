import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Check, Pause, Play, RotateCcw, Save } from "lucide-react";
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
import type { Technique } from "@/lib/library";

type Phase = { label: string; secs: number };

function useJournalSave(kind: string, title: string, day?: number | undefined) {
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
      <CardContent className="flex flex-col items-center gap-5 py-8">
        <motion.div
          animate={{ scale: running ? [0.85, 1.08, 0.85] : 1 }}
          transition={{
            duration: current.secs * 2,
            repeat: running ? Infinity : 0,
            ease: "easeInOut",
          }}
          className="flex h-40 w-40 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-lift"
        >
          <span className="text-4xl font-semibold">{left}</span>
        </motion.div>
        <div className="text-center">
          <p className="text-lg font-medium">{current.label}</p>
          <p className="text-sm text-muted-foreground">
            Ciclo {cycle} de {cycles}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setRunning((r) => !r)} className="tap-scale">
            {running ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {running ? "Pausar" : "Começar"}
          </Button>
          <Button
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
          <Button variant="secondary" onClick={() => setRunning((r) => !r)}>
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
        <div className="flex gap-2">
          <Button onClick={() => setRunning((r) => !r)} className="tap-scale">
            {running ? "Pausar" : "Começar"}
          </Button>
          <Button
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
  "Encha a pia ou uma bacia com água bem fria (com gelo, se possível).",
  "Respire fundo e prenda o ar.",
  "Mergulhe o rosto — testa, olhos e maçãs do rosto — por 15 a 30 segundos.",
  "Volte devagar e repita se precisar.",
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
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            onClick={() => setStep((s) => Math.min(DIVE_STEPS.length - 1, s + 1))}
          >
            Próximo passo
          </Button>
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl">{hold}s</span>
            <Button
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
        <div className="relative h-28 overflow-hidden rounded-2xl bg-gradient-primary">
          <motion.div
            animate={{ x: ["-10%", "10%", "-10%"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-x-0 bottom-0 h-16 rounded-t-[100%] bg-background/30"
          />
          <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm font-medium text-primary-foreground">
            A onda sobe, atinge o pico e desce. Você não precisa fazer nada além de respirar.
          </p>
        </div>
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

function ContractTool() {
  const [name, setName] = useState("");
  const [commitments, setCommitments] = useState([false, false, false, false]);
  const { save, saving } = useJournalSave("contract", "Contrato de Compromisso");
  const labels = [
    "Vou praticar pelo menos uma técnica por dia.",
    "Vou tratar recaídas como parte do processo, não como fracasso.",
    "Vou pedir ajuda profissional se precisar.",
    "Vou falar comigo com o cuidado que ofereço a quem amo.",
  ];

  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        {labels.map((label, i) => (
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
          className="w-full tap-scale"
          disabled={saving || !name.trim() || commitments.some((c) => !c)}
          onClick={() => save({ name, commitments: labels })}
        >
          <Check className="mr-2 h-4 w-4" />
          Assinar compromisso
        </Button>
      </CardContent>
    </Card>
  );
}

export function ToolRenderer({
  technique,
  day,
}: {
  technique: Technique;
  day?: number | undefined;
}) {
  const config = (technique.toolConfig ?? {}) as {
    pattern?: Phase[];
    cycles?: number;
    minutes?: number;
    prompts?: string[];
  };
  const prompts = useMemo(() => config.prompts ?? [], [config.prompts]);

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
      return <ContractTool />;
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
