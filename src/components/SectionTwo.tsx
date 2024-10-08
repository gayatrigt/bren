import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { cn } from "~/utils/helpers";
import { FaChevronDown } from "react-icons/fa6";
import { createIcon, BlockiesOptions } from '@download/blockies';

export interface RankingData {
  fid: number | null;
  tgUsername: string | null;
  walletAddress: string;
  tipsReceived: number | null;
  tipsSent: number | null;
  tipsReceivedCount: number | null;
  tipsSentCount: number | null;
}

export interface ApiResponse {
  data: Rankings[];
  pagination: Pagination;
}

export interface Rankings {
  fid: number;
  tgUsername: string;
  walletAddress: string;
  tipsReceived: number;
  tipsSent: number;
  tipsReceivedCount: number;
  tipsSentCount: number;
  rank: number;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface User {
  fid?: number | null;
  username?: string;
  display_name?: string | null;
  pfp_url?: string | null;
  tgUsername?: string | null
}

export interface EnrichedRankingData extends Omit<RankingData, 'fid' | 'walletAddress' | 'tgUsername'> {
  fid: number | null;
  walletAddress: string | null;
  tgUsername: string | null;
  userDetails: User | null;
  rank: number;
  displayRank?: number;
}

export interface UserRank {
  fid: number;
  tgUsername: string;
  walletAddress: string;
  tipsReceived: number;
  tipsSent: number;
  tipsReceivedCount: number;
  tipsSentCount: number;
  rank: number;
  userDetails: User;
}

const SectionTwo = () => {
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
  const [userRanking, setUserRanking] = useState<UserRank | null>(null);
  const { address } = useAccount();

  const fetchUserRanking = async () => {
    if (!address) return;

    try {
      const response = await fetch(
        `/api/user-ranking?address=${address}&sort=${selectedTab?.key}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch user ranking");
      }
      const data: UserRank = await response.json();
      setUserRanking(data);
    } catch (error) {
      console.error("Error fetching user ranking:", error);
    }
  };

  // const fetchRankings = async () => {
  //   setLoading(true);
  //   try {
  //     // Fetch rankings
  //     const response = await fetch(
  //       `/api/db-rankings?sort=${selectedTab?.key}&page=1&limit=10`,
  //     );
  //     if (!response.ok) {
  //       throw new Error("Failed to fetch rankings");
  //     }
  //     const data: ApiResponse = await response.json();

  //     // Fetch user details
  //     const fids = data.data.map((ranking) => ranking.fid).join(",");
  //     const userResponse = await fetch(`/api/neynar-users?fids=${fids}`);
  //     if (!userResponse.ok) {
  //       throw new Error("Failed to fetch user details");
  //     }
  //     const userData: { users: User[] } = await userResponse.json();

  //     // Combine ranking data with user details
  //     const enrichedRankings = data.data.map((ranking) => ({
  //       ...ranking,
  //       userDetails: userData.users.find((user) => user.fid === ranking.fid),
  //     }));

  //     setRankings(enrichedRankings);
  //   } catch (error) {
  //     console.error("Error fetching data:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchRankings = async () => {
    setLoading(true);
    try {
      console.log("Fetching top rankings...");
      const response = await fetch(
        `/api/db-rankings?sort=${selectedTab?.key}&page=1&limit=10`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch rankings");
      }
      const data: ApiResponse = await response.json();
      console.log("Top ranking data:", data);

      console.log("Fetching user details...");

      // Helper function to fetch user details by FIDs
      const fetchUserDetailsByFids = async (fids: number[]): Promise<User[]> => {
        try {
          const userResponse = await fetch(`/api/neynar-users?fids=${fids.join(',')}`);
          if (!userResponse.ok) {
            console.warn(`Failed to fetch user details for FIDs`);
            return [];
          }
          const userData: { users: User[] } = await userResponse.json();
          return userData.users;
        } catch (error) {
          console.error(`Error fetching user details for FIDs:`, error);
          return [];
        }
      };

      // Helper function to fetch user details by wallet addresses
      const fetchUserDetailsByAddresses = async (addresses: string[]): Promise<Record<string, User[]>> => {
        try {
          const userResponse = await fetch(`/api/neynar-users-by-address?addresses=${addresses.join(',')}`);
          if (!userResponse.ok) {
            console.warn(`Failed to fetch user details for addresses`);
            return {};
          }
          return await userResponse.json();
        } catch (error) {
          console.error(`Error fetching user details for addresses:`, error);
          return {};
        }
      };

      // Helper function to generate blockies
      const generateBlockies = (seed: string): string => {
        const icon = createIcon({
          seed: seed,
          size: 8,
          scale: 4,
        });
        return icon.toDataURL();
      };

      // Group rankings by FID, wallet address, and tgUsername
      const fidGroup: number[] = [];
      const addressGroup: string[] = [];
      const tgUsernameGroup: { ranking: RankingData; tgUsername: string }[] = [];

      data.data.forEach(ranking => {
        if (ranking.fid) {
          fidGroup.push(ranking.fid);
        } else if (ranking.walletAddress) {
          addressGroup.push(ranking.walletAddress);
        } else if (ranking.tgUsername) {
          tgUsernameGroup.push({ ranking, tgUsername: ranking.tgUsername });
        }
      });

      // Fetch user details in batches
      const userDetailsByFid = await fetchUserDetailsByFids(fidGroup);
      const userDetailsByAddress = await fetchUserDetailsByAddresses(addressGroup);

      // Combine all user details
      const enrichedRankings: EnrichedRankingData[] = data.data.map((ranking, index) => {
        let userDetails: User | null | undefined;
        if (ranking.fid) {
          userDetails = userDetailsByFid.find(user => user.fid === ranking.fid) || null;
        } else if (ranking.walletAddress) {
          userDetails = userDetailsByAddress[ranking.walletAddress.toLowerCase()]?.[0] || null;
        } else if (ranking.tgUsername) {
          userDetails = {
            username: ranking.tgUsername,
            display_name: ranking.tgUsername,
            pfp_url: null,
          } as User;
        } else {
          userDetails = null;
        }

        // Generate blockies if no pfp_url
        if (userDetails && !userDetails.pfp_url) {
          const seed = userDetails.username || userDetails.display_name || ranking.tgUsername || 'random';
          userDetails.pfp_url = generateBlockies(seed);
        }

        return {
          ...ranking,
          userDetails,
          fid: ranking.fid || null,
          walletAddress: ranking.walletAddress || null,
          tgUsername: ranking.tgUsername || null,
          rank: index + 1, // Assign rank based on the order
        };
      });

      setRankings(enrichedRankings);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchRankings(), fetchUserRanking()]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedTab, address]);

  return (
    <section className="bg-G-100 px-5 py-8 lg:px-10 lg:py-20">
      <h1 className="mb-1 text-center text-xl font-bold text-white lg:text-[40px]">
        Top Ten Brens
      </h1>
      <p className="mx-auto max-w-[600px] text-center text-sm text-white lg:text-2xl">
        Climb the ranks of Based recognition. The Bren <br />
        leaderboard showcases not only Bren recipients, <br />
        but also top performers in various categories.
      </p>

      <div className="mx-auto mt-6 w-fit lg:hidden">
        <div className="relative inline-block">
          <select
            value={selectedTab?.key}
            className="focus:ring-none w-full appearance-none rounded-lg bg-white bg-opacity-20 px-2 py-2 text-sm font-medium text-[#FFFC00] focus:outline-none"
            onChange={(e) => {
              const newkey = e.target.value;
              setSelectedTab(tabs?.find((t) => t?.key === newkey));
            }}
          >
            {tabs?.map((tab) => (
              <option key={tab?.key} value={tab?.key}>
                {tab?.title}
              </option>
            ))}
          </select>
          <FaChevronDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#FFFC00]" />
        </div>
      </div>

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
            <div className="py-4 text-center">Loading...</div>
          ) : (
            <>
              {userRanking && (
                <div
                  className="grid w-full grid-cols-[40px_60px_1fr_90px] items-center gap-4 border-2 border-purple-500 bg-purple-50 px-3 py-2.5 lg:grid-cols-[60px_200px_1fr_284px] lg:gap-20 lg:px-8 lg:py-5"
                  key={userRanking.fid}
                >
                  <h1 className="text-center text-xs text-B-60 lg:text-lg">
                    {String(userRanking.rank).padStart(2, "0")}
                  </h1>
                  <div className="w-full">
                    <a
                      href={`https://warpcast.com/${userRanking.userDetails?.username || ""}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex justify-center"
                    >
                      {userRanking.userDetails?.pfp_url && (
                        <img
                          alt="Profile"
                          src={userRanking.userDetails.pfp_url}
                          className="h-8 w-8 rounded-full object-cover"
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
                    {userRanking.fid ? (
                      <a
                        href={`https://warpcast.com/${userRanking.userDetails?.username || ""}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-B-60 lg:text-lg"
                      >
                        {userRanking.userDetails?.username ||
                          `${userRanking.walletAddress.slice(0, 6)}...${userRanking.walletAddress.slice(-4)}`}
                      </a>
                    ) : (
                      <span className="text-xs text-B-60 lg:text-lg">
                        {userRanking.userDetails?.username ||
                          `${userRanking.walletAddress.slice(0, 6)}...${userRanking.walletAddress.slice(-4)}`}
                      </span>
                    )}
                  </div>
                  <p className="text-center text-xs text-B-60 lg:text-base">
                    {userRanking[selectedTab?.key as keyof RankingData] || 0}
                  </p>
                </div>
              )}

              {rankings.map((ranking, index) => (
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
                      {ranking.userDetails?.pfp_url && (
                        <img
                          alt="Profile"
                          src={ranking.userDetails.pfp_url}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      )}
                    </a>
                  </div>
                  <div className="flex w-full items-center gap-2 overflow-hidden">
                    <div className="relative h-[14px] w-[14px] lg:h-[22px] lg:w-[22px]">
                      <Image
                        src="/icons/bolt_circle.svg"
                        alt="Bolt"
                        layout="fill"
                      />
                    </div>
                    {/* <a
                      href={`https://warpcast.com/${ranking.userDetails?.username || ""}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-xs text-B-60 lg:text-lg"
                    > */}
                    {ranking.userDetails?.username ||
                      `${ranking.walletAddress?.slice(0, 6)}...${ranking.walletAddress?.slice(-4)}`}

                  </div>

                  <p className="text-center text-xs text-B-60 lg:text-base">
                    {ranking[selectedTab?.key as keyof RankingData] || 0}
                  </p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="mt-6 lg:mt-12">
        <Link href="/leaderboard">
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
        </Link>
      </div>
    </section>
  );
};

export default SectionTwo;
