import React from "react";
import Nav from "./Nav";
import Image from "next/image";

const Hero = () => {
  const mindsetList = [
    {
      title: "Integrity",
      description: "Do the right thing, even if it’s hard.",
    },
    {
      title: "Teamwork",
      description: "Put the team over the individual.",
    },
    {
      title: "Tenacity",
      description: "Work hard and persevere.",
    },
    {
      title: "Creativity",
      description: "Push boundaries with innovative ideas.",
    },
    {
      title: "Optimism",
      description: "Stay positive and optimistic in the face of challenges.",
    },
  ];
  return (
    <div className="bg-Y-100 min-h-screen w-full">
      <Nav />
      <section className="hero-globe relative mx-auto mt-10 h-[850px] w-full overflow-x-hidden lg:max-w-[1600px] lg:px-[60px]">
        <section className="relative z-[5] mx-auto flex h-[700px] w-full flex-col justify-center lg:max-w-[1200px]">
          <h1 className="text-pu-100 stroke-pu-100 mb-4 text-[60px] font-bold leading-tight">
            Recognize your <br />
            Base frens with Bren
          </h1>
          <h2 className="text-pu-100 mb-5 text-[28px] leading-tight">
            Reward based contributions to the onchain <br />
            economy by sending $bren and shoutouts
          </h2>
          <button className="border-p-100 text-pu-100 w-[210px] rounded border bg-white py-4 text-lg font-bold shadow-[8px_8px_0px_0px_#BD44D9]">
            Check Eligibility
          </button>
        </section>
      </section>
      <section className="hero-champ relative mx-auto -mt-20 w-full overflow-x-hidden lg:max-w-[1600px] lg:px-[60px]">
        <section className="relative z-[5] mx-auto mb-20 w-full max-w-[1200px] rounded-[24px] bg-[rgba(43,0,53,0.04)] px-[100px] py-20 shadow-[0px_0px_8px_0px_rgba(17,16,17,0.08)]">
          <h1 className="text-pu-100 mb-2 text-center text-[40px] font-bold">
            Embrace the Based Mindset
          </h1>

          <p className="text-pu-100 mb-12 text-center text-[22px]">
            BREN is built upon a set of core values that define the based
            mindset
          </p>
          <div className="grid gap-12 lg:grid-cols-[380px_1fr]">
            <div className=" bg-pu-100 flex h-[380px] w-full items-center justify-center rounded-xl">
              <div className="relative h-[360px] w-[360px]">
                <Image layout="fill" src="/icons/tweet_1.png" alt="Tweet" />
              </div>
            </div>
            <div className="space-y-5">
              {mindsetList?.map((item) => (
                <div key={item?.title} className="gap-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-pu-100 h-1 w-1" />
                    <h1 className="text-2xl font-bold">{item?.title}</h1>
                  </div>
                  <p className="ml-3 text-xl text-[#2B003599]">
                    {item?.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>
    </div>
  );
};

export default Hero;
