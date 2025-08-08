import { motion } from "framer-motion";
import Loader from "./Loader";

interface FullScreenLoaderProps {
  message?: string;
  variant?: "dots" | "pulse" | "spin" | "wave";
}

const FullScreenLoader = ({ message = "Loading...", variant = "dots" }: FullScreenLoaderProps) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  const contentVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        delay: 0.1,
        duration: 0.4,
      },
    },
  };

  return (
    <motion.div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div className="flex flex-col items-center space-y-4" variants={contentVariants}>
        <Loader variant={variant} size="lg" />
        <motion.p
          className="text-lg font-medium text-muted-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {message}
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default FullScreenLoader;
