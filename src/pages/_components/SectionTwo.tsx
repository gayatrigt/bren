import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { cn } from "~/utils/helpers";

interface RankingData {
  fid: number;
  walletAddress: string;
  tipsReceived: number | null;
  tipsSent: number | null;
  tipsReceivedCount: number | null;
  tipsSentCount: number | null;
}

export interface ApiResponse {
  data: Rankings[]
  pagination: Pagination
}

export interface Rankings {
  fid: number
  walletAddress: string
  tipsReceived: number
  tipsSent: number
  tipsReceivedCount: number
  tipsSentCount: number
}

export interface Pagination {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

interface User {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
}

interface EnrichedRankingData extends RankingData {
  userDetails?: User;
}


const SectionTwo = () => {
  const tabs = [
    { title: "Top Bren Recipients", key: "tipsReceived", header: "BREN Earned" },
    { title: "Top Bren Givers", key: "tipsSent", header: "BREN Given" },
    { title: "Top Shoutout Recipients", key: "tipsReceivedCount", header: "Shoutouts" },
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
        const response = await fetch(`/api/db-rankings?sort=${selectedTab?.key}&page=1&limit=10`);
        if (!response.ok) {
          throw new Error('Failed to fetch rankings');
        }
        const data: ApiResponse = await response.json();

        // Fetch user details
        const fids = data.data.map(ranking => ranking.fid).join(',');
        const userResponse = await fetch(`/api/neynar-users?fids=${fids}`);
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user details');
        }
        const userData: { users: User[] } = await userResponse.json();

        // Combine ranking data with user details
        const enrichedRankings = data.data.map(ranking => ({
          ...ranking,
          userDetails: userData.users.find(user => user.fid === ranking.fid)
        }));

        setRankings(enrichedRankings);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [selectedTab]);


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
      <div className="mx-auto mt-6 w-full max-w-[1024px] rounded-xl border border-B-40 bg-white">
        <div className="grid w-full grid-cols-[40px_60px_1fr_90px] gap-4 border-b-[0.5px] border-B-40 px-3 py-2.5 text-xs font-bold text-B-100 lg:grid-cols-[60px_200px_1fr_284px] lg:gap-20 lg:px-8 lg:py-5 lg:text-xl">
          <h1>Rank</h1>
          <h1 className="text-center">Profile</h1>
          <h1 className="">Name</h1>
          <h1 className="text-center">{selectedTab?.header}</h1>
        </div>

        <div className="divide-y-[0.5px] divide-B-40">
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            rankings.map((ranking, index) => (
              <div
                className="grid w-full items-center grid-cols-[40px_60px_1fr_90px] gap-4 px-3 py-2.5 lg:grid-cols-[60px_200px_1fr_284px] lg:gap-20 lg:px-8 lg:py-5"
                key={ranking.fid}
              >
                <h1 className="text-center text-xs text-B-60 lg:text-lg">
                  {String(index + 1).padStart(2, '0')}
                </h1>
                <div className="w-full">
                  <a href={`https://warpcast.com/${ranking.userDetails?.username || ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex justify-center"
                  >
                    {ranking.userDetails?.pfp_url ? (
                      <img
                        alt="Profile"
                        src={ranking.userDetails.pfp_url}
                        className="rounded-full h-8 w-8"
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
                  <a href={`https://warpcast.com/${ranking.userDetails?.username || ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-B-60 lg:text-lg">
                    {ranking.userDetails?.username || `${ranking.walletAddress.slice(0, 6)}...${ranking.walletAddress.slice(-4)}`}
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
