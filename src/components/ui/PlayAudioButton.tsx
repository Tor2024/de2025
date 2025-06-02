"use client";
import { useState, useRef } from 'react';
import { Volume2, Ban } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';
import { Button } from './button';

interface PlayAudioButtonProps {
  text: string;
  lang?: string; // BCP-47, например 'de-DE', 'en-US', 'ru-RU'
  className?: string;
  size?: number; // размер иконки
  tooltipPlay?: string;
  tooltipStop?: string;
}

export function PlayAudioButton({
  text,
  lang = 'en-US',
  className = '',
  size = 22,
  tooltipPlay = 'Прослушать',
  tooltipStop = 'Остановить',
}: PlayAudioButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const play = () => {
    if (!text) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.onstart = () => setIsPlaying(true);
    utter.onend = () => setIsPlaying(false);
    utter.onerror = () => setIsPlaying(false);
    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
  };

  const stop = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={isPlaying ? tooltipStop : tooltipPlay}
          className={`rounded-full p-2 transition-colors ${isPlaying ? 'bg-primary/10 text-primary' : 'hover:bg-accent hover:text-accent-foreground'} ${className}`}
          onClick={isPlaying ? stop : play}
        >
          {isPlaying ? <Ban className="animate-pulse" width={size} height={size} /> : <Volume2 width={size} height={size} />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <span>{isPlaying ? tooltipStop : tooltipPlay}</span>
      </TooltipContent>
    </Tooltip>
  );
} 