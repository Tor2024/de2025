"use client";
import { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, Ban } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';
import { Button } from './button';
import { mapInterfaceLanguageToBcp47, mapTargetLanguageToBcp47, type TargetLanguage, type InterfaceLanguage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface MultiVoiceAudioPlayerProps {
  script: string;
  targetLang: TargetLanguage;
  interfaceLang?: InterfaceLanguage;
  className?: string;
  size?: number;
  tooltipPlay?: string;
  tooltipStop?: string;
}

export function MultiVoiceAudioPlayer({
  script,
  targetLang,
  interfaceLang,
  className = '',
  size = 22,
  tooltipPlay = 'Прослушать',
  tooltipStop = 'Остановить',
}: MultiVoiceAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();
  const utteranceQueueRef = useRef<SpeechSynthesisUtterance[]>([]);
  const currentUtteranceIndexRef = useRef<number>(0);
  const playIdRef = useRef<number>(0);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  const ttsNotSupported = typeof window === 'undefined' || !window.speechSynthesis;

  // Load voices
  useEffect(() => {
    if (ttsNotSupported) return;
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [ttsNotSupported]);

  const selectVoice = useCallback((langCode: string, gender: 'male' | 'female' | 'any'): SpeechSynthesisVoice | undefined => {
    if (ttsNotSupported) return undefined;
    
    let candidates = voicesRef.current.filter(voice => voice.lang.startsWith(langCode.split('-')[0]));
    if (candidates.length === 0) return undefined;

    if (gender !== 'any') {
      const genderCandidates = candidates.filter(voice => {
        const name = voice.name.toLowerCase();
        if (gender === 'male') return name.includes('male') || name.includes('mann') || name.includes('мужской');
        if (gender === 'female') return name.includes('female') || name.includes('frau') || name.includes('женский');
        return false;
      });
      if (genderCandidates.length > 0) candidates = genderCandidates;
    }
    
    // Prioritize certain voices
    const googleVoice = candidates.find(v => v.name.toLowerCase().includes('google'));
    if (googleVoice) return googleVoice;
    const defaultVoice = candidates.find(v => v.default);
    if (defaultVoice) return defaultVoice;

    return candidates[0];
  }, [ttsNotSupported]);

  const playNextInQueue = useCallback((playId: number) => {
    if (playId !== playIdRef.current) return; // A new play request has started
    if (currentUtteranceIndexRef.current >= utteranceQueueRef.current.length) {
      setIsPlaying(false);
      return;
    }

    const utterance = utteranceQueueRef.current[currentUtteranceIndexRef.current];
    utterance.onend = () => {
      currentUtteranceIndexRef.current++;
      playNextInQueue(playId);
    };
    utterance.onerror = (event) => {
      console.error("SpeechSynthesisUtterance.onerror", event);
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const prepareAndPlay = useCallback(() => {
    if (!script) return;
    if (ttsNotSupported) {
      toast({ title: "TTS не поддерживается", description: "Ваш браузер не поддерживает синтез речи.", variant: "destructive" });
      return;
    }

    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    
    playIdRef.current++;
    const currentPlayId = playIdRef.current;

    const lines = script.split('\n').filter(line => line.trim() !== '');
    const speakerRegex = /^(Speaker \d+|Person [A-Z]|Mann|Frau|Sprecher \d+):\s*/i;
    
    utteranceQueueRef.current = [];
    currentUtteranceIndexRef.current = 0;

    const bcp47TargetLang = mapTargetLanguageToBcp47(targetLang);
    const maleVoice = selectVoice(bcp47TargetLang, 'male');
    const femaleVoice = selectVoice(bcp47TargetLang, 'female');

    for (const line of lines) {
      const match = line.match(speakerRegex);
      let textToSpeak = line;
      let voice: SpeechSynthesisVoice | undefined;

      if (match) {
        textToSpeak = line.replace(speakerRegex, '').trim();
        const speakerId = match[0].toLowerCase();
        
        // Simple logic to alternate voices if specific gendered voices are available
        if (speakerId.includes('1') || speakerId.includes(' a') || speakerId.includes('mann')) {
          voice = maleVoice || femaleVoice;
        } else if (speakerId.includes('2') || speakerId.includes(' b') || speakerId.includes('frau')) {
          voice = femaleVoice || maleVoice;
        }
      }

      if (textToSpeak) {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = bcp47TargetLang;
        utterance.voice = voice || selectVoice(bcp47TargetLang, 'any') || null;
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utteranceQueueRef.current.push(utterance);
      }
    }

    if (utteranceQueueRef.current.length > 0) {
      setIsPlaying(true);
      playNextInQueue(currentPlayId);
    }

  }, [script, targetLang, selectVoice, playNextInQueue, ttsNotSupported, toast]);

  const stop = () => {
    if (ttsNotSupported) return;
    playIdRef.current++; // Invalidate current playback loop
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const handleClick = () => {
    if (isPlaying) {
      stop();
    } else {
      prepareAndPlay();
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
          onClick={handleClick}
          disabled={ttsNotSupported}
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
