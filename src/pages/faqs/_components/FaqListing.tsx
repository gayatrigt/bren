import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

const FaqListing = ({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) => {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="p-3 lg:p-6">
      <div
        className="flex cursor-pointer items-center justify-between gap-2"
        onClick={() => setShowAnswer(!showAnswer)}
      >
        <h1 className="text-base font-bold text-B-100 lg:text-xl">
          {question}
        </h1>

        <Image
          height={24}
          width={24}
          src="/icons/caret-down-black.svg"
          alt="Caret"
        />
      </div>

      <AnimatePresence>
        {showAnswer && (
          <motion.p
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ type: "easeOut" }}
            className="mt-1 text-sm text-B-100 lg:mt-2 lg:text-base"
          >
            {answer}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FaqListing;
