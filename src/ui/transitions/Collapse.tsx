import { PropsWithChildren, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type TProps = PropsWithChildren & {
  isVisible: boolean;
  collapseDuration?: number;
  collapseInDuration?: number;
  collapseOutDuration?: number;
  delay?: number;
  className?: string;
  isInitial?: boolean;
  onExitComplete?: () => void;
};

export default function Collapse(props: TProps) {
  const {
    isVisible,
    children,
    collapseDuration = 0.3,
    collapseInDuration = collapseDuration,
    collapseOutDuration = collapseDuration,
    delay = 0,
    className,
    isInitial = false,
    onExitComplete,
  } = props;

  const animationVariants = useMemo(
    () => ({
      initial: {
        height: 0,
        opacity: 0,
      },
      animate: {
        height: 'auto',
        opacity: 1,
        transition: {
          height: {
            duration: collapseInDuration,
          },
          opacity: {
            duration: collapseInDuration,
            delay,
          },
        },
      },
      exit: {
        height: 0,
        opacity: 0,
        transition: {
          height: {
            duration: collapseOutDuration,
          },
          opacity: {
            duration: collapseOutDuration,
            delay,
          },
        },
      },
    }),
    [collapseInDuration, collapseOutDuration, delay],
  );

  return (
    <AnimatePresence initial={isInitial} onExitComplete={onExitComplete}>
      {isVisible && (
        <motion.div
          className={className}
          key='collapse'
          style={{ overflow: 'hidden' }}
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
