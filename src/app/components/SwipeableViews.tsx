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
  const dragTargetRef = useRef<EventTarget | null>(null);
  const blockSwipeUntilRef = useRef<number>(0);

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

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Clear any timeouts when component unmounts
      blockSwipeUntilRef.current = 0;
    };
  }, []);

  // Check if the event target is a direct child of our container
  const isValidDragTarget = (target: EventTarget | null): boolean => {
    if (!target || !(target instanceof Node) || !containerRef.current)
      return false;

    // Check if swipe events are temporarily blocked (e.g. after dropdown selection)
    if (Date.now() < blockSwipeUntilRef.current) return false;

    // If the target or any of its parents have a data attribute indicating it's a dropdown/select
    // or if they have class names that suggest they are from a dropdown, block swiping
    let element: Node | null = target;
    while (element && element instanceof Element) {
      if (
        element.nodeName === "SELECT" ||
        element.getAttribute("role") === "combobox" ||
        element.getAttribute("role") === "listbox" ||
        element.getAttribute("role") === "option" ||
        element.classList.contains("select") ||
        element.classList.contains("dropdown") ||
        element.getAttribute("data-state") === "open"
      ) {
        // Block swiping for 300ms after interacting with dropdown elements
        blockSwipeUntilRef.current = Date.now() + 300;
        return false;
      }
      element = element.parentNode;
    }

    // Check if the target is the container itself or a direct slide element
    if (target === containerRef.current) return true;

    // Check if the target is one of our slide elements or its descendant
    const slideElements = Array.from(containerRef.current.children);
    return slideElements.some(
      (slide) => slide === target || slide.contains(target),
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      // Store the target element to check if it's where the drag started
      dragTargetRef.current = e.target;

      // Only initiate dragging if this is a valid drag target
      if (isValidDragTarget(e.target)) {
        startXRef.current = e.touches[0].clientX;
        isDraggingRef.current = true;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (
      !isDraggingRef.current ||
      startXRef.current === null ||
      !containerRef.current ||
      !e.touches[0] ||
      dragTargetRef.current !== e.target // Ensure this is the same target where dragging started
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
    // Store the target element
    dragTargetRef.current = e.target;

    // Only initiate dragging if this is a valid drag target
    if (isValidDragTarget(e.target)) {
      startXRef.current = e.clientX;
      isDraggingRef.current = true;
      e.preventDefault(); // Prevent text selection during drag
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (
      !isDraggingRef.current ||
      startXRef.current === null ||
      !containerRef.current ||
      dragTargetRef.current !== e.target // Ensure this is the same target where dragging started
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
      dragTargetRef.current = null;
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
