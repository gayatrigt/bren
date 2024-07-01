import Image from "next/image";
import React from "react";

const SectionOne = () => {
  return (
    <div className="w-full px-[60px]">
      <div className="relative mx-auto h-[300px] w-[1000px]">
        <Image src="/icons/logo_big_lg.svg" alt="Bren" layout="fill" />
      </div>
      <div className="bg-blu-100 mx-auto w-full max-w-[1600px] rounded-[40px] px-[128px] py-[100px]">
        <h1 className="mb-2 text-center text-[40px] font-bold text-white">
          How Bren Works
        </h1>
        <h2 className="text-W-100 mb-[60px] text-center text-[22px]">
          Recognize and Reward Based Contributions
        </h2>

        <div className="grid grid-cols-2 gap-12">
          <div></div>
        </div>
      </div>
      <div className="relative mx-auto h-[300px] w-[1000px]">
        <Image src="/icons/logo_big_lg.svg" alt="Bren" layout="fill" />
      </div>
    </div>
  );
};

export default SectionOne;
