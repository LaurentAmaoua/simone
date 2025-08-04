import {
  useState,
  useRef,
  useEffect,
  type RefObject,
} from "react";

interface UseSwipeableViewsProps {
  initialIndex?: number;
  onChangeIndex?: (index: number) => void;
  containerRef: RefObject<HTMLDivElement>;
  childrenCount: number;
}

interface UseSwipeableViewsReturn {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  goToIndex: (index: number) => void;
  touchHandlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
  mouseHandlers: {
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: (e: React.MouseEvent) => void;
    onMouseLeave: (e: React.MouseEvent) => void;
  };
}

export function useSwipeableViews({
  initialIndex = 0,
  onChangeIndex,
  containerRef,
  childrenCount,
}: UseSwipeableViewsProps): UseSwipeableViewsReturn {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const isVerticalScrollingRef = useRef(false);
  const isHorizontalSwipingRef = useRef(false);
  const dragTargetRef = useRef<EventTarget | null>(null);
  const blockSwipeUntilRef = useRef<number>(0);
  const touchMoveListenerAdded = useRef(false);
  const removeListenersRef = useRef<(() => void) | null>(null);
  const lastTouchX = useRef<number | null>(null);
  const lastTouchY = useRef<number | null>(null);

  // Use this to track touch position even during capture phase
  const touchPositionTracker = useRef<{
    identifier: number | null;
    lastX: number | null;
    lastY: number | null;
    diffX: number | null;
    diffY: number | null;
  }>({
    identifier: null,
    lastX: null,
    lastY: null,
    diffX: null,
    diffY: null,
  });

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
      // Remove any event listeners and clear timeouts
      if (removeListenersRef.current) {
        removeListenersRef.current();
      }
      blockSwipeUntilRef.current = 0;
    };
  }, []);

  // Add global touch event listeners for capturing events
  const addGlobalTouchListeners = (startEvent: React.TouchEvent) => {
    if (touchMoveListenerAdded.current) return;

    // Get the touch identifier for tracking this specific touch
    const touchId = startEvent.touches[0]?.identifier ?? 0;
    touchPositionTracker.current.identifier = touchId;
    touchPositionTracker.current.lastX = startEvent.touches[0]?.clientX ?? null;
    touchPositionTracker.current.lastY = startEvent.touches[0]?.clientY ?? null;

    // Track all touch movements globally to properly prevent scrolling
    const handleGlobalTouchMove = (e: TouchEvent) => {
      // Find our specific touch point
      const touchPoint = Array.from(e.touches).find(
        (touch) => touch.identifier === touchPositionTracker.current.identifier,
      );

      if (
        touchPoint &&
        touchPositionTracker.current.lastX !== null &&
        touchPositionTracker.current.lastY !== null
      ) {
        // Update position trackers
        touchPositionTracker.current.diffX =
          touchPositionTracker.current.lastX - touchPoint.clientX;
        touchPositionTracker.current.diffY =
          touchPositionTracker.current.lastY - touchPoint.clientY;
        touchPositionTracker.current.lastX = touchPoint.clientX;
        touchPositionTracker.current.lastY = touchPoint.clientY;

        // If we're in horizontal swipe mode, prevent all scrolling
        if (isHorizontalSwipingRef.current) {
          e.preventDefault();
          e.stopPropagation();

          // Update the transform if we have a container
          if (
            containerRef.current &&
            touchPositionTracker.current.diffX !== null
          ) {
            const translateX =
              -activeIndex * 100 -
              (touchPositionTracker.current.diffX /
                (containerRef.current.offsetWidth || 1)) *
                100;
            containerRef.current.style.transform = `translateX(${translateX}%)`;
          }
        }
      }
    };

    const handleGlobalTouchEnd = (_e: TouchEvent) => {
      // Process the end of the swipe if it was horizontal
      if (
        isHorizontalSwipingRef.current &&
        containerRef.current &&
        startXRef.current !== null &&
        touchPositionTracker.current.lastX !== null
      ) {
        const diff = startXRef.current - touchPositionTracker.current.lastX;

        // Determine if swipe was significant enough
        if (Math.abs(diff) > (containerRef.current.offsetWidth || 1) * 0.2) {
          if (diff > 0 && activeIndex < childrenCount - 1) {
            // Swipe left
            setActiveIndex(activeIndex + 1);
          } else if (diff < 0 && activeIndex > 0) {
            // Swipe right
            setActiveIndex(activeIndex - 1);
          }
        }

        // Reset the transform to the final position
        resetTransform();
      }

      // Clean up
      removeGlobalListeners();
    };

    // Add listeners with capture phase and passive: false to allow preventDefault
    document.addEventListener("touchmove", handleGlobalTouchMove, {
      passive: false,
      capture: true,
    });
    document.addEventListener("touchend", handleGlobalTouchEnd, {
      capture: true,
    });
    document.addEventListener("touchcancel", handleGlobalTouchEnd, {
      capture: true,
    });

    touchMoveListenerAdded.current = true;

    // Store cleanup function
    removeListenersRef.current = () => {
      document.removeEventListener("touchmove", handleGlobalTouchMove, {
        capture: true,
      });
      document.removeEventListener("touchend", handleGlobalTouchEnd, {
        capture: true,
      });
      document.removeEventListener("touchcancel", handleGlobalTouchEnd, {
        capture: true,
      });
      touchMoveListenerAdded.current = false;

      // Reset touch tracker
      touchPositionTracker.current = {
        identifier: null,
        lastX: null,
        lastY: null,
        diffX: null,
        diffY: null,
      };
    };
  };

  const removeGlobalListeners = () => {
    if (removeListenersRef.current) {
      removeListenersRef.current();
      removeListenersRef.current = null;
    }
  };

  // Check if the event target is a direct child of our container
  const isValidDragTarget = (target: EventTarget | null): boolean => {
    if (!target || !(target instanceof Node) || !containerRef.current)
      return false;

    // Check if swipe events are temporarily blocked (e.g. after dropdown selection)
    if (Date.now() < blockSwipeUntilRef.current) return false;

    // If vertical scrolling is active, block horizontal swiping
    if (isVerticalScrollingRef.current) return false;

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
    // Clean up any existing listeners first
    removeGlobalListeners();

    if (e.touches[0]) {
      // Store the target element to check if it's where the drag started
      dragTargetRef.current = e.target;

      // Reset scrolling/swiping states on touch start
      isVerticalScrollingRef.current = false;
      isHorizontalSwipingRef.current = false;

      // Capture both X and Y coordinates to detect direction
      startXRef.current = e.touches[0].clientX;
      startYRef.current = e.touches[0].clientY;
      lastTouchX.current = e.touches[0].clientX;
      lastTouchY.current = e.touches[0].clientY;

      // We'll determine if this is a valid target once we know the direction
      isDraggingRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (
      !isDraggingRef.current ||
      startXRef.current === null ||
      startYRef.current === null ||
      !containerRef.current ||
      !e.touches[0]
    )
      return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = startXRef.current - currentX;
    const diffY = startYRef.current - currentY;

    // Store the last touch position
    lastTouchX.current = currentX;
    lastTouchY.current = currentY;

    // If horizontal swiping is already active, let the global handler manage it
    if (isHorizontalSwipingRef.current) {
      return;
    }

    // If vertical scrolling is already active, allow native scrolling
    if (isVerticalScrollingRef.current) {
      return;
    }

    // Determine scroll direction on the first significant movement
    if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10) {
      // Movement too small to determine direction yet
      return;
    }

    // If we haven't determined the scrolling direction yet, do it now
    if (dragTargetRef.current === e.target) {
      // If vertical scrolling is more significant than horizontal, lock to vertical
      if (Math.abs(diffY) > Math.abs(diffX)) {
        isVerticalScrollingRef.current = true;
        isDraggingRef.current = false;
        return;
      }

      // If horizontal swiping is more significant, ensure it's a valid target
      if (!isValidDragTarget(e.target)) {
        isDraggingRef.current = false;
        return;
      }

      // Lock to horizontal swiping
      isHorizontalSwipingRef.current = true;

      // Add global touch listeners to capture all move events
      addGlobalTouchListeners(e);

      e.preventDefault(); // Prevent vertical scrolling

      // Add visual feedback during swipe
      const translateX =
        -activeIndex * 100 -
        (diffX / (containerRef.current?.offsetWidth || 1)) * 100;
      containerRef.current.style.transform = `translateX(${translateX}%)`;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // If not using global handlers (for whatever reason), process the end here
    if (!touchMoveListenerAdded.current) {
      if (
        !isDraggingRef.current ||
        startXRef.current === null ||
        startYRef.current === null ||
        !containerRef.current ||
        !e.changedTouches[0] ||
        isVerticalScrollingRef.current // Don't process swipe if vertical scrolling was detected
      ) {
        // Reset state
        resetState();
        return;
      }

      // Process horizontal swipe
      const currentX = e.changedTouches[0].clientX;
      const diff = startXRef.current - currentX;

      // Determine if swipe was significant enough
      if (Math.abs(diff) > (containerRef.current?.offsetWidth || 1) * 0.2) {
        if (diff > 0 && activeIndex < childrenCount - 1) {
          // Swipe left
          setActiveIndex(activeIndex + 1);
        } else if (diff < 0 && activeIndex > 0) {
          // Swipe right
          setActiveIndex(activeIndex - 1);
        }
      }

      resetTransform();
    }

    // Global handlers will clean up themselves
  };

  const resetState = () => {
    isVerticalScrollingRef.current = false;
    isHorizontalSwipingRef.current = false;
    startYRef.current = null;
    startXRef.current = null;
    isDraggingRef.current = false;
    lastTouchX.current = null;
    lastTouchY.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Store the target element
    dragTargetRef.current = e.target;

    // Only initiate dragging if this is a valid drag target
    if (isValidDragTarget(e.target)) {
      startXRef.current = e.clientX;
      isDraggingRef.current = true;
      isHorizontalSwipingRef.current = true;
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
      if (diff > 0 && activeIndex < childrenCount - 1) {
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
      resetState();
    }
  };

  const handleMouseLeave = () => {
    if (isDraggingRef.current) {
      resetTransform();
    }
  };

  const goToIndex = (index: number) => {
    if (index >= 0 && index < childrenCount) {
      setActiveIndex(index);
    }
  };

  return {
    activeIndex,
    setActiveIndex,
    goToIndex,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    mouseHandlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
    },
  };
}
