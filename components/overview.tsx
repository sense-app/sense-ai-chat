import { motion } from 'framer-motion';

import { ShoppingIcon } from './icons';

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center max-w-xl">
        <p className="flex flex-row justify-center gap-4 items-center">
          <ShoppingIcon size={48} />
        </p>
        <p>
          Shop smarter with <span className="font-bold">Shopper AI</span> – Earn cashback on your purchases!
        </p>
        <p>
          Find the best products across stores with deep shopping research and enjoy personalized recommendations that
          evolve with your preferences.
        </p>
      </div>
    </motion.div>
  );
};
