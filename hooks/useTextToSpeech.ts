import { useState, useEffect, useCallback } from 'react';

interface UseTextToSpeechOptions {
  voice?: string;
  pitch?: number;
  rate?: number;
  volume?: number;
}

export const useTextToSpeech = (options: UseTextToSpeechOptions = {}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem('fluow_tts_enabled');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('fluow_tts_enabled', String(enabled));
  }, [enabled]);

  useEffect(() => {
    const updateVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    window.speechSynthesis.onvoiceschanged = updateVoices;
    updateVoices();

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!enabled || !text) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure options
    utterance.pitch = options.pitch ?? 1;
    utterance.rate = options.rate ?? 1;
    utterance.volume = options.volume ?? 1;

    // Try to find a Portuguese voice if available
    const ptVoice = voices.find(v => v.lang.startsWith('pt'));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [enabled, voices, options]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const toggle = useCallback(() => {
    setEnabled(prev => !prev);
  }, []);

  return {
    speak,
    stop,
    toggle,
    enabled,
    isSpeaking,
    voices
  };
};
