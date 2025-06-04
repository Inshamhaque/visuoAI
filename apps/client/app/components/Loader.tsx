import { motion } from "framer-motion";
import { cn } from "../lib/utils";

interface LoaderProps {
  variant?: "dots" | "pulse" | "spin" | "wave";
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

const Loader = ({
  variant = "dots",
  size = "md",
  color = "bg-primary",
  className,
}: LoaderProps) => {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const containerSizes = {
    sm: "gap-1",
    md: "gap-2",
    lg: "gap-3",
  };

  const dotVariants = {
    initial: { scale: 0.8, opacity: 0.5 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.6,
        repeat: Infinity,
        repeatType: "reverse" as const,
        ease: "easeInOut",
      },
    },
  };

  const containerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const pulseVariants = {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.2, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const spinVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      },
    },
  };

  const waveVariants = {
    initial: { y: 0 },
    animate: {
      y: [-8, 0, -8],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  if (variant === "dots") {
    return (
      <motion.div
        className={cn(
          "flex items-center justify-center",
          containerSizes[size],
          className
        )}
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className={cn("rounded-full", sizeClasses[size], color)}
            variants={dotVariants}
          />
        ))}
      </motion.div>
    );
  }

  if (variant === "pulse") {
    return (
      <motion.div
        className={cn("rounded-full", sizeClasses[size], color, className)}
        variants={pulseVariants}
        initial="initial"
        animate="animate"
      />
    );
  }

  if (variant === "spin") {
    return (
      <motion.div
        className={cn("border-2 border-t-transparent rounded-full", className)}
        style={{
          width: size === "sm" ? "16px" : size === "md" ? "24px" : "32px",
          height: size === "sm" ? "16px" : size === "md" ? "24px" : "32px",
          borderColor: `hsl(var(--primary))`,
        }}
        variants={spinVariants}
        animate="animate"
      />
    );
  }

  if (variant === "wave") {
    return (
      <motion.div
        className={cn(
          "flex items-center justify-center",
          containerSizes[size],
          className
        )}
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        {[0, 1, 2, 3, 4].map((index) => (
          <motion.div
            key={index}
            className={cn("rounded-full", sizeClasses[size], color)}
            variants={waveVariants}
            transition={{
              delay: index * 0.1,
            }}
          />
        ))}
      </motion.div>
    );
  }

  return null;
};

export default Loader;
