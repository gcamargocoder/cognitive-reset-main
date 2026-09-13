import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/** Toca em loop o áudio de frequência recomendado para a técnica. */
export function TonePlayer({ src, label }: { src: string; label: string }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const toggle = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.6;
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {
        toast.error("Não foi possível tocar o áudio agora.");
      });
      setPlaying(true);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-primary-soft/40 p-4">
      <div>
        <p className="text-sm font-semibold">Frequência sonora recomendada</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      <Button size="lg" onClick={toggle} className="shrink-0">
        {playing ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
        {playing ? "Parar" : "Tocar"}
      </Button>
    </div>
  );
}
