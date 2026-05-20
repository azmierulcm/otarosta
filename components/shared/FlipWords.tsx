'use client';

import { AnimatePresence, motion } from 'framer-motion';
import * as React from 'react';

interface FlipWordsProps {
  words: string[];
  duration?: number;
  letterDelay?: number;
  wordDelay?: number;
  className?: string;
}

export function FlipWords({
  words,
  duration = 3000,
  letterDelay = 0.05,
  wordDelay = 0.3,
  className = '',
}: FlipWordsProps) {
  const [currentWord, setCurrentWord] = React.useState(words[0]);
  const [isAnimating, setIsAnimating]  = React.useState(false);

  const startAnimation = React.useCallback(() => {
    const nextIdx = (words.indexOf(currentWord) + 1) % words.length;
    setCurrentWord(words[nextIdx]);
    setIsAnimating(true);
  }, [currentWord, words]);

  React.useEffect(() => {
    if (isAnimating) return;
    const id = setTimeout(startAnimation, duration);
    return () => clearTimeout(id);
  }, [isAnimating, duration, startAnimation]);

  return (
    <span className={`inline-block relative ${className}`}>
      <AnimatePresence onExitComplete={() => setIsAnimating(false)}>
        <motion.span
          key={currentWord}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40, x: 40, filter: 'blur(8px)', scale: 1.5, position: 'absolute' }}
          transition={{ type: 'spring', stiffness: 100, damping: 10 }}
          className="inline-block relative text-left"
        >
          {currentWord.split(' ').map((word, wi) => (
            <motion.span
              key={`${word}-${wi}`}
              className="inline-block whitespace-nowrap"
              initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: wi * wordDelay, duration: 0.3 }}
            >
              {word.split('').map((letter, li) => (
                <motion.span
                  key={`${word}-${li}`}
                  className="inline-block"
                  initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ delay: wi * wordDelay + li * letterDelay, duration: 0.2 }}
                >
                  {letter}
                </motion.span>
              ))}
              <span className="inline-block">&nbsp;</span>
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
