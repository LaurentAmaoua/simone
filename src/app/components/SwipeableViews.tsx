import { useRef, type ReactNode } from "react";
import styles from "./styles/SwipeableViews.module.css";
import { useSwipeableViews } from "../hooks/useSwipeableViews";

interface SwipeableViewsProps {
  children: ReactNode[];
  initialIndex?: number;
  onChangeIndex?: (index: number) => void;
}

export const SwipeableViews = ({
  children,
  initialIndex = 0,
  onChangeIndex,
}: SwipeableViewsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { activeIndex, goToIndex, touchHandlers, mouseHandlers } =
    useSwipeableViews({
      initialIndex,
      onChangeIndex,
      containerRef,
      childrenCount: children.length,
    });

  return (
    <div className={styles.swipeableContainer}>
      <div
        className={styles.swipeableSlides}
        ref={containerRef}
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        onTouchStart={touchHandlers.onTouchStart}
        onTouchMove={touchHandlers.onTouchMove}
        onTouchEnd={touchHandlers.onTouchEnd}
        onMouseDown={mouseHandlers.onMouseDown}
        onMouseMove={mouseHandlers.onMouseMove}
        onMouseUp={mouseHandlers.onMouseUp}
        onMouseLeave={mouseHandlers.onMouseLeave}
      >
        {children.map((child, index) => (
          <div
            key={index}
            className={styles.swipeableSlide}
            aria-hidden={index !== activeIndex}
          >
            {child}
          </div>
        ))}
      </div>
      <div className={styles.footerGradient}></div>
      <div className={styles.dotsContainer}>
        {children.map((_, index) => (
          <button
            key={index}
            className={`${styles.dot} ${index === activeIndex ? styles.activeDot : ""}`}
            onClick={() => goToIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export const SwipeableViewsFooter = ({
  labels,
  activeIndex,
  onChangeIndex,
}: {
  labels: string[];
  activeIndex: number;
  onChangeIndex: (index: number) => void;
}) => {
  return (
    <div className={styles.footer}>
      {labels.map((label, index) => (
        <button
          key={index}
          className={`${styles.footerButton} ${index === activeIndex ? styles.activeButton : ""}`}
          onClick={() => onChangeIndex(index)}
        >
          {label}
        </button>
      ))}
    </div>
  );
};
