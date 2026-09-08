import { useState, useEffect, useRef } from 'react';

export const useTimer = (initialSeconds = 0, onExpire = null) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    let timer = null;
    if (isActive && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && secondsLeft === 0) {
      setIsActive(false);
      if (onExpireRef.current) {
        onExpireRef.current();
      }
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActive, secondsLeft]);

  const startTimer = () => setIsActive(true);
  const pauseTimer = () => setIsActive(false);
  const resetTimer = (newSeconds = initialSeconds) => {
    setIsActive(false);
    setSecondsLeft(newSeconds);
  };

  return {
    secondsLeft,
    isActive,
    startTimer,
    pauseTimer,
    resetTimer
  };
};
