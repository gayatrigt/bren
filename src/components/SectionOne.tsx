import Image from "next/image";
import React from "react";

const SectionOne = () => {
  const rewardListing = [
    {
      title: "Join the network",
      icon: "/icons/network.svg",
      text: "Simply get started with joining the Bren network by being allow-listed or downloading Onboard.",
      number: "01",
    },
    {
      title: "Tipping Weekly",
      icon: "/icons/tip_jar.svg",
      text: "Every week, you’ll receive a $bren allocation to award points and shoutouts to other users directly from Warpcast or Telegram.",
      number: "02",
    },
    {
      title: "Move Upward",
      icon: "/icons/icons_park.svg",
      text: "Climb the real-time leaderboard. Your BREN cred (points) increaase based on your recognitions (shoutouts given and received), and activities onchain.",
      number: "03",
    },
    {
      title: "Build Onchain",
      icon: "/icons/star.svg",
      text: "Boost your BREN cred by building onchain and showcasing your based contributions. (Coming Soon)",
      number: "04",
    },
  ];
  return (
    <div className="w-full px-5 lg:px-[60px]">
      <div className="relative mx-auto h-[120px] w-[300px] lg:h-[300px] lg:w-[1000px]">
        <Image src="/icons/logo_big_lg.svg" alt="Bren" layout="fill" />
      </div>
      <div className="mx-auto w-full max-w-[1600px] rounded-lg bg-blu-100 px-6 py-10 lg:rounded-[40px] lg:px-[128px] lg:py-[100px]">
        <h1 className="text-center text-xl font-bold text-white lg:mb-2 lg:text-[40px]">
          How Bren Works
        </h1>
        <h2 className="mb-5 text-center text-sm text-W-100 lg:mb-[60px] lg:text-[22px]">
          Recognize, Reward, and Earn for Onchain Contributions
        </h2>

        <div className="grid items-stretch gap-12 lg:grid-cols-2">
          {rewardListing?.map((reward) => (
            <div
              key={reward?.title}
              className="rounded-xl border border-[rgba(255,255,255,0.40)] bg-[rgba(255,255,255,0.08)] px-5 py-8 lg:px-10 lg:py-[72px]"
            >
              <div className="relative hidden h-[58px] w-[58px] lg:block">
                <Image alt={reward?.title} src={reward?.icon} layout="fill" />
              </div>
              <p className="mb-2 text-[40px] font-bold text-[#FFFFFF66] lg:hidden">
                {reward?.number}
              </p>
              <p className="text-lg font-bold leading-tight text-white lg:mt-6 lg:text-[32px]">
                <span className="hidden lg:inline-block">
                  {reward?.number}.
                </span>{" "}
                {reward?.title}
              </p>
              <p className="mt-1 text-sm leading-tight text-white lg:mt-3 lg:text-[26px]">
                {reward?.text}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="relative mx-auto h-[120px] w-[300px] lg:h-[300px] lg:w-[1000px]">
        <Image src="/icons/logo_big_lg.svg" alt="Bren" layout="fill" />
      </div>
    </div>
  );
};

export default SectionOne;
