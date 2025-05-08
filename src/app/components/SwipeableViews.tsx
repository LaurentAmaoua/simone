import { useEffect, useState, useRef, type ReactNode } from "react";
import styles from "./styles/SwipeableViews.module.css";

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
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  // Update parent if index changes
  useEffect(() => {
    if (onChangeIndex) {
      onChangeIndex(activeIndex);
    }
  }, [activeIndex, onChangeIndex]);

  // Set initial index if it changes
  useEffect(() => {
    setActiveIndex(initialIndex);
  }, [initialIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      startXRef.current = e.touches[0].clientX;
      isDraggingRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (
      !isDraggingRef.current ||
      startXRef.current === null ||
      !containerRef.current ||
      !e.touches[0]
    )
      return;

    const currentX = e.touches[0].clientX;
    const diff = startXRef.current - currentX;

    // Add visual feedback during swipe
    const translateX =
      -activeIndex * 100 -
      (diff / (containerRef.current?.offsetWidth || 1)) * 100;
    containerRef.current.style.transform = `translateX(${translateX}%)`;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (
      !isDraggingRef.current ||
      startXRef.current === null ||
      !containerRef.current ||
      !e.changedTouches[0]
    )
      return;

    const currentX = e.changedTouches[0].clientX;
    const diff = startXRef.current - currentX;

    // Determine if swipe was significant enough
    if (Math.abs(diff) > (containerRef.current?.offsetWidth || 1) * 0.2) {
      if (diff > 0 && activeIndex < children.length - 1) {
        // Swipe left
        setActiveIndex(activeIndex + 1);
      } else if (diff < 0 && activeIndex > 0) {
        // Swipe right
        setActiveIndex(activeIndex - 1);
      }
    }

    resetTransform();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startXRef.current = e.clientX;
    isDraggingRef.current = true;
    e.preventDefault(); // Prevent text selection during drag
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (
      !isDraggingRef.current ||
      startXRef.current === null ||
      !containerRef.current
    )
      return;

    const currentX = e.clientX;
    const diff = startXRef.current - currentX;

    // Add visual feedback during swipe
    const translateX =
      -activeIndex * 100 -
      (diff / (containerRef.current?.offsetWidth || 1)) * 100;
    containerRef.current.style.transform = `translateX(${translateX}%)`;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (
      !isDraggingRef.current ||
      startXRef.current === null ||
      !containerRef.current
    )
      return;

    const currentX = e.clientX;
    const diff = startXRef.current - currentX;

    // Determine if swipe was significant enough
    if (Math.abs(diff) > (containerRef.current?.offsetWidth || 1) * 0.2) {
      if (diff > 0 && activeIndex < children.length - 1) {
        // Swipe left
        setActiveIndex(activeIndex + 1);
      } else if (diff < 0 && activeIndex > 0) {
        // Swipe right
        setActiveIndex(activeIndex - 1);
      }
    }

    resetTransform();
  };

  const resetTransform = () => {
    if (containerRef.current) {
      containerRef.current.style.transform = `translateX(-${activeIndex * 100}%)`;
      isDraggingRef.current = false;
      startXRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    if (isDraggingRef.current) {
      resetTransform();
    }
  };

  const goToIndex = (index: number) => {
    if (index >= 0 && index < children.length) {
      setActiveIndex(index);
    }
  };

  return (
    <div className={styles.swipeableContainer}>
      <div
        className={styles.swipeableSlides}
        ref={containerRef}
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
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
