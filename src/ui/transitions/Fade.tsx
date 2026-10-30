import { PropsWithChildren, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type TProps = PropsWithChildren & {
  isVisible: boolean;
  fadeDuration?: number;
  fadeInDuration?: number;
  fadeOutDuration?: number;
  delay?: number;
  className?: string;
  isInitial?: boolean;
  onExitComplete?: () => void;
};

export default function Fade(props: TProps) {
  const {
    isVisible,
    children,
    fadeDuration = 0.2,
    fadeInDuration = fadeDuration,
    fadeOutDuration = fadeDuration,
    delay = 0,
    className,
    isInitial = false,
    onExitComplete,
  } = props;

  const animationVariants = useMemo(
    () => ({
      initial: {
        opacity: 0,
      },
      animate: {
        opacity: 1,
        transition: {
          duration: fadeInDuration,
          delay,
        },
      },
      exit: {
        opacity: 0,
        transition: {
          duration: fadeOutDuration,
          delay,
        },
      },
    }),
    [fadeInDuration, fadeOutDuration, delay],
  );

  return (
    <AnimatePresence initial={isInitial} onExitComplete={onExitComplete}>
      {isVisible && (
        <motion.div
          className={className}
          key='fade'
          initial={animationVariants.initial}
          animate={animationVariants.animate}
          exit={animationVariants.exit}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
