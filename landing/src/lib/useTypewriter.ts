import { useEffect, useState } from 'react';

export function useTypewriter(text: string, opts?: { speed?: number; start?: boolean; delay?: number }) {
  const speed = opts?.speed ?? 30;
  const start = opts?.start ?? true;
  const delay = opts?.delay ?? 0;
  const [out, setOut] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!start) {
      setOut('');
      setDone(false);
      return;
    }
    let i = 0;
    let interval: number | null = null;
    const startTimer = window.setTimeout(() => {
      interval = window.setInterval(() => {
        i++;
        setOut(text.slice(0, i));
        if (i >= text.length) {
          if (interval) window.clearInterval(interval);
          setDone(true);
        }
      }, speed);
    }, delay);
    return () => {
      window.clearTimeout(startTimer);
      if (interval) window.clearInterval(interval);
    };
  }, [text, speed, start, delay]);

  return { text: out, done };
}
