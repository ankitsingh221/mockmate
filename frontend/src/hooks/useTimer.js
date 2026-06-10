import { useEffect, useRef, useState, useCallback } from "react";


export function useTimer(initialSeconds, onExpire) {
  const [timeLeft, setTimeLeft]   = useState(initialSeconds);
  const [running,  setRunning]    = useState(false);
  const onExpireRef               = useRef(onExpire);
  const intervalRef               = useRef(null);

  // Keep callback ref fresh without restarting the timer
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  // Reset when initialSeconds changes )
  useEffect(() => {
    setTimeLeft(initialSeconds);
    setRunning(false);
    clearInterval(intervalRef.current);
  }, [initialSeconds]);

  // Tick
  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          onExpireRef.current?.();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const start  = useCallback(() => setRunning(true),  []);
  const pause  = useCallback(() => setRunning(false), []);
  const reset  = useCallback((s) => {
    clearInterval(intervalRef.current);
    setTimeLeft(s ?? initialSeconds);
    setRunning(false);
  }, [initialSeconds]);

  const pct = initialSeconds > 0 ? (timeLeft / initialSeconds) * 100 : 0;

  return { timeLeft, running, pct, start, pause, reset };
}