import { motion } from 'framer-motion';

export const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
};

export const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5
};

export const PageTransition = ({ children }) => (
    <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
    >
        {children}
    </motion.div>
);
