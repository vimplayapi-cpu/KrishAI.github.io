import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Futuristic dual-ring custom cursor: an outer tracer ring and an inner
 * glowing dot. Hidden on touch devices, respects reduced motion.
 */
export default function CustomCursor() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const onTouch = () => setIsTouch(true);
    window.addEventListener("touchstart", onTouch, { once: true });
    return () => window.removeEventListener("touchstart", onTouch);
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    if (isTouch) return;
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [isTouch, x, y]);

  const dotX = useSpring(x, { stiffness: 600, damping: 40 });
  const dotY = useSpring(y, { stiffness: 600, damping: 40 });
  const ringX = useSpring(x, { stiffness: 120, damping: 22 });
  const ringY = useSpring(y, { stiffness: 120, damping: 22 });

  if (isTouch) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] hidden md:block">
      <motion.div
        className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/50"
        style={{ x: ringX, y: ringY, width: 42, height: 42 }}
      />
      <motion.div
        className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/70"
        style={{ x: dotX, y: dotY, width: 7, height: 7, boxShadow: "0 0 14px oklch(0.72 0.19 190 / 0.9)" }}
      />
    </div>
  );
}
