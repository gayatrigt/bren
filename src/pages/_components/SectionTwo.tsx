import Image from "next/image";
import React, { useState } from "react";
import { cn } from "~/utils/helpers";

const SectionTwo = () => {
  const tabs = [
    { title: "Top Bren Recipients", key: "bren-recipients" },
    { title: "Top Bren Givers", key: "bren-givers" },
    { title: "Top Shoutout Recipients", key: "shoutout-recipient" },
    { title: "Top Shoutout Givers", key: "shoutout-givers" },
  ];
  const [selectedTab, setSelectedTab] = useState(tabs?.at(0));

  const contributorListing = [
    { rank: "01", name: "jessepollak" },
    { rank: "02", name: "ikechipollak" },
    { rank: "03", name: "jesseonu" },
    { rank: "04", name: "ybcarster" },
    { rank: "05", name: "jessepollak" },
    { rank: "06", name: "jessepollak" },
    { rank: "07", name: "jessepollak" },
    { rank: "08", name: "jessepollak" },
    { rank: "09", name: "ybcarster" },
    { rank: "10", name: "ikechipollak" },
  ];

  return (
    <section className="bg-G-100 px-5 py-8 lg:px-10 lg:py-20">
      <h1 className="mb-1 text-center text-xl font-bold text-white lg:text-[40px]">
        Top Ten Brens
      </h1>
      <p className="mx-auto max-w-[600px] text-center text-xs text-white lg:text-2xl">
        Climb the ranks of Based recognition. The Bren <br />
        leaderboard showcases not only Bren recipients, <br />
        but also top performers in various categories.
      </p>
      <div className="mx-auto mt-12 hidden w-full max-w-[980px] items-center justify-between rounded-[14px] bg-[rgba(17,16,17,0.16)] px-5 lg:flex">
        {tabs?.map((tab) => (
          <div
            key={tab?.title}
            className={cn(
              "relative cursor-pointer py-5 text-center text-xl text-white",
              {
                "active-tab text-Y-100": selectedTab?.title === tab?.title,
              },
            )}
            onClick={() => setSelectedTab(tab)}
          >
            {tab?.title}
          </div>
        ))}
      </div>
      <div className="mx-auto mt-6 w-full max-w-[1024px] rounded-xl border border-B-40 bg-white">
        <div className="grid w-full grid-cols-[40px_60px_1fr_90px] gap-4 border-b-[0.5px] border-B-40 px-3 py-2.5 text-xs font-bold text-B-100 lg:grid-cols-[60px_200px_1fr_284px] lg:gap-20 lg:px-8 lg:py-5 lg:text-xl">
          <h1>Rank</h1>
          <h1 className="text-center">Profile</h1>
          <h1 className="">Name</h1>
          <h1 className="text-center">BREN Cred</h1>
        </div>

        <div className="divide-y-[0.5px] divide-B-40">
          {contributorListing?.map((contributor) => (
            <div
              className="grid w-full grid-cols-[40px_60px_1fr_90px] gap-4 px-3 py-2.5 lg:grid-cols-[60px_200px_1fr_284px] lg:gap-20 lg:px-8 lg:py-5"
              key={contributor?.name}
            >
              <h1 className="text-center text-xs text-B-60 lg:text-lg">
                {contributor?.rank}
              </h1>
              <div className="w-full">
                <div className="relative mx-auto h-[14px] w-[14px] lg:h-[22px] lg:w-[22px]">
                  <Image
                    layout="fill"
                    alt="Profile"
                    src="/icons/profile_icon.svg"
                  />
                </div>
              </div>
              <div className="flex w-full items-center gap-2">
                <div className="relative h-[14px] w-[14px] lg:h-[22px] lg:w-[22px]">
                  <Image
                    src="/icons/bolt_circle.svg"
                    alt="Bolt"
                    layout="fill"
                  />
                </div>

                <p className="text-xs text-B-60 lg:text-lg">
                  {contributor?.name}
                </p>
              </div>

              <p className="text-center text-xs text-B-60 lg:text-base">255</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 lg:mt-12">
        <button className="bg mx-auto flex items-center gap-2 rounded-md bg-B-100 p-3 lg:rounded-xl lg:p-6">
          <p className="text-xs text-white lg:text-xl">View Leaderboard</p>
          <div className="relative h-3 w-3 lg:h-6 lg:w-6">
            <Image
              src="/icons/white_arrow_left.svg"
              alt="Arrow"
              layout="fill"
            />
          </div>
        </button>
      </div>
    </section>
  );
};

export default SectionTwo;
