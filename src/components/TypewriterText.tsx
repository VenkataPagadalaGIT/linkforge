"use client";
import { useEffect, useState } from "react";

interface TypewriterTextProps {
  words: string[];
  className?: string;
}

const TypewriterText = ({ words, className = "" }: TypewriterTextProps) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  // SSR renders the FIRST word as real text, so on networks whose proxies
  // block our scripts (nothing hydrates) the line still says something
  // instead of showing a lone cursor. With JS, the animation takes over.
  const [currentText, setCurrentText] = useState(words[0] ?? "");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const word = words[currentWordIndex];

    // Fully typed (including the pre-hydrated first word): hold it on screen,
    // then start deleting. One code path for the pause, no nested timers.
    if (!isDeleting && currentText === word) {
      const pause = setTimeout(() => setIsDeleting(true), 2000);
      return () => clearTimeout(pause);
    }

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setCurrentText(word.slice(0, currentText.length + 1));
      } else {
        setCurrentText(word.slice(0, currentText.length - 1));
        if (currentText.length <= 1) {
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, isDeleting ? 40 : 80);

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentWordIndex, words]);

  return (
    <span className={className}>
      {currentText}
      <span className="animate-blink text-foreground/60">|</span>
    </span>
  );
};

export default TypewriterText;
