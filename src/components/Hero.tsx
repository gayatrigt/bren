/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import Popup from "./ElibilityPopup";
import { useAccount } from "wagmi";

const Hero = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const { address } = useAccount();

  const handleOpenPopup = () => setIsPopupOpen(true);
  const handleClosePopup = () => setIsPopupOpen(false);

  const mindsetList = [
    {
      title: "Reward & Be Rewarded",
      description: "Recognize fellow builders on Farcaster and in Telegram groups.",
    },
    {
      title: "Build and Grow",
      description: "Launch an app with 100+ users and watch your bren points soar.",
    },
    {
      title: "Spend and Earn",
      description: "Earn bren points with every transaction with Onboard",
    },
    {
      title: "Connect and Collaborate",
      description: "Join city chapters and attend IRL events.",
    },
    // {
    //   title: "Innovate and Inspire",
    //   description: "Stay positive and optimistic in the face of challenges.",
    // },
  ];
  return (
    <div className="min-h-screen w-full bg-Y-100 pt-[160px] lg:pt-[200px]">
      <section className="hero-globe relative mx-auto  w-full overflow-x-hidden px-5 lg:h-[800px] lg:max-w-[1600px] lg:px-[60px]">
        <section className="relative z-[5] mx-auto flex h-[510px] w-full flex-col justify-center lg:h-[700px] lg:max-w-[1200px]">
          <h1 className="mb-2 stroke-pu-100 text-[32px] font-bold leading-tight text-pu-100 lg:mb-4 lg:text-[60px]">
            Earn points <br className="lg:hidden" />
            for your <br className="hidden lg:block" />
            onchain activities <br className="hidden lg:block" />
            with Bren
          </h1>
          <h2 className="mb-3 text-lg leading-tight text-pu-100 lg:mb-5 lg:text-[28px] ">
            Reward and get rewarded for contributions <br className="hidden lg:block" />
            to the onchain economy
          </h2>
          <button
            className="rounded border border-p-100 bg-white py-3 text-xs font-bold text-pu-100
           shadow-[8px_8px_0px_0px_#BD44D9] md:w-[125px] lg:w-[210px] lg:py-4 lg:text-lg"
            onClick={handleOpenPopup}
          >
            Check Eligibility
          </button>
        </section>
      </section>
      <section className="hero-champ relative mx-auto -mt-20 w-full overflow-x-hidden px-5 lg:max-w-[1600px] lg:px-[60px]">
        <section className="relative z-[5] mx-auto mb-20 w-full max-w-[1200px] rounded-[24px] bg-[rgba(43,0,53,0.04)] px-6 py-10 shadow-[0px_0px_8px_0px_rgba(17,16,17,0.08)] lg:px-[100px] lg:py-20">
          <h1 className="mb-1 text-center text-lg font-bold text-pu-100 lg:mb-2 lg:text-[40px]">
            Embrace the Onchain Dreamer Mindset
          </h1>
          <p className="mb-4 text-center text-sm text-pu-100 lg:mb-12 lg:text-[22px]">
            bren rewards builders and creators who are shaping the onchain future
          </p>
          <div className="grid gap-5 lg:grid-cols-[380px_1fr] lg:gap-12">
            <div className=" mx-auto flex w-full max-w-[380px] items-center justify-center rounded-xl bg-pu-100 p-2 lg:p-0">
              <div className="relative h-auto w-full max-w-[360px]">
                <img
                  src="/icons/tweet_1.png"
                  alt="Tweet"
                  className="object-contain"
                />
              </div>
            </div>
            <div className="space-y-3 lg:space-y-5">
              {mindsetList?.map((item) => (
                <div key={item?.title} className="gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-1 bg-pu-100" />
                    <h1 className="text-base font-bold lg:text-2xl">
                      {item?.title}
                    </h1>
                  </div>
                  <p className="ml-3 text-sm text-[#2B003599] lg:text-xl">
                    {item?.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>
      <Popup
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
        address={address || ""}
      />
    </div>
  );
};

export default Hero;
