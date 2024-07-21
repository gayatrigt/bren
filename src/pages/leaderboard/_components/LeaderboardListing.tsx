import Image from "next/image";
import React, { useEffect, useState } from "react";
import {
  ApiResponse,
  EnrichedRankingData,
  User,
} from "~/pages/_components/SectionTwo";
import { cn } from "~/utils/helpers";

const LeaderboardListing = () => {
  const tabs = [
    {
      title: "Top Bren Recipients",
      key: "tipsReceived",
      header: "BREN Earned",
    },
    { title: "Top Bren Givers", key: "tipsSent", header: "BREN Given" },
    {
      title: "Top Shoutout Recipients",
      key: "tipsReceivedCount",
      header: "Shoutouts",
    },
    { title: "Top Shoutout Givers", key: "tipsSentCount", header: "Shoutouts" },
  ];
  const [selectedTab, setSelectedTab] = useState(tabs?.at(0));

  const [rankings, setRankings] = useState<EnrichedRankingData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      try {
        // Fetch rankings
        const response = await fetch(
          `/api/db-rankings?sort=${selectedTab?.key}&page=1&limit=10`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch rankings");
        }
        const data: ApiResponse = await response.json();

        // Fetch user details
        const fids = data.data.map((ranking) => ranking.fid).join(",");
        const userResponse = await fetch(`/api/neynar-users?fids=${fids}`);
        if (!userResponse.ok) {
          throw new Error("Failed to fetch user details");
        }
        const userData: { users: User[] } = await userResponse.json();

        // Combine ranking data with user details
        const enrichedRankings = data.data.map((ranking) => ({
          ...ranking,
          userDetails: userData.users.find((user) => user.fid === ranking.fid),
        }));

        setRankings(enrichedRankings);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [selectedTab]);

  return (
    <div className="mx-auto mt-12 w-full max-w-[1200px] px-5 lg:px-10">
      <div className="mx-auto hidden w-full items-center justify-between rounded-[14px] bg-[#2C9569] px-16  lg:flex">
        {tabs.map((tab) => (
          <div
            key={tab.key}
            className={cn(
              "relative cursor-pointer py-5 text-center text-xl text-white",
              {
                "active-tab text-Y-100": selectedTab?.key === tab.key,
              },
            )}
            onClick={() => setSelectedTab(tab)}
          >
            {tab.title}
          </div>
        ))}
      </div>

      <p className="my-8 text-sm font-medium text-B-40 lg:text-[22px]">
        Highest amount of points distributed by Brens.
      </p>

      <div className="mx-auto mt-6 w-full rounded-xl border border-B-40 bg-white">
        <div className="grid w-full grid-cols-[40px_60px_1fr_90px] gap-4 border-b-[0.5px] border-B-40 px-3 py-2.5 text-xs font-bold text-B-100 lg:grid-cols-[60px_200px_1fr_284px] lg:gap-20 lg:px-8 lg:py-5 lg:text-xl">
          <h1>Rank</h1>
          <h1 className="text-center">Profile</h1>
          <h1 className="">Name</h1>
          <h1 className="text-center">{selectedTab?.header}</h1>
        </div>

        <div className="divide-y-[0.5px] divide-B-40">
          {loading ? (
            <div className="py-4 text-center">Loading...</div>
          ) : (
            rankings.map((ranking, index) => (
              <div
                className="grid w-full grid-cols-[40px_60px_1fr_90px] items-center gap-4 px-3 py-2.5 lg:grid-cols-[60px_200px_1fr_284px] lg:gap-20 lg:px-8 lg:py-5"
                key={ranking.fid}
              >
                <h1 className="text-center text-xs text-B-60 lg:text-lg">
                  {String(index + 1).padStart(2, "0")}
                </h1>
                <div className="w-full">
                  <a
                    href={`https://warpcast.com/${ranking.userDetails?.username || ""}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex justify-center"
                  >
                    {ranking.userDetails?.pfp_url ? (
                      <img
                        alt="Profile"
                        src={ranking.userDetails.pfp_url}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <Image
                        layout="fill"
                        alt="Profile"
                        src="/icons/profile_icon.svg"
                      />
                    )}
                  </a>
                </div>
                <div className="flex w-full items-center gap-2">
                  <div className="relative h-[14px] w-[14px] lg:h-[22px] lg:w-[22px]">
                    <Image
                      src="/icons/bolt_circle.svg"
                      alt="Bolt"
                      layout="fill"
                    />
                  </div>
                  <a
                    href={`https://warpcast.com/${ranking.userDetails?.username || ""}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-B-60 lg:text-lg"
                  >
                    {ranking.userDetails?.username ||
                      `${ranking.walletAddress.slice(0, 6)}...${ranking.walletAddress.slice(-4)}`}
                  </a>
                </div>

                <p className="text-center text-xs text-B-60 lg:text-base">
                  {ranking[selectedTab?.key as keyof RankingData] || 0}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardListing;
