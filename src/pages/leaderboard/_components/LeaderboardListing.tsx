import Image from "next/image";
import React, { useCallback, useEffect, useState } from "react";
import { FaChevronDown } from "react-icons/fa6";
import { useAccount } from "wagmi";
import {
  ApiResponse,
  EnrichedRankingData,
  User,
  Rankings,
  Pagination,
  UserRank,
  RankingData,
} from "~/components/SectionTwo";
import { cn } from "~/utils/helpers";

const PaginationButton: React.FC<{
  page: number | string;
  isActive: boolean;
  onClick: () => void;
}> = ({ page, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`h-8 w-8 rounded-full border text-sm font-medium ${isActive
      ? "border-purple-800 bg-purple-800 text-white"
      : "border-gray-300 bg-transparent text-gray-600 hover:bg-gray-100"
      } mx-0.5`} // Added mx-0.5 for closer spacing
  >
    {page}
  </button>
);

const LeaderboardListing: React.FC = () => {
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
  const [selectedTab, setSelectedTab] = useState(tabs[0]);
  const [rankings, setRankings] = useState<EnrichedRankingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });
  const [filteredRankings, setFilteredRankings] = useState<EnrichedRankingData[]>([]);
  const [filteredPagination, setFilteredPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });
  const [allRankings, setAllRankings] = useState<EnrichedRankingData[]>([]);
  const [displayedRankings, setDisplayedRankings] = useState<EnrichedRankingData[]>([]);

  const [userRanking, setUserRanking] = useState<UserRank | null>(null);
  const { address } = useAccount();

  const filterAndSortRankings = useCallback((rankings: EnrichedRankingData[]) => {
    const filteredRankings = rankings.filter((ranking) => {
      const metric = ranking[selectedTab?.key as keyof Rankings];
      return metric !== 0 && metric !== null;
    });
    console.log("Filtered rankings:", filteredRankings);

    const sortedRankings = filteredRankings.sort((a, b) => {
      const metricA = a[selectedTab?.key as keyof Rankings] as number;
      const metricB = b[selectedTab?.key as keyof Rankings] as number;
      return metricB - metricA;
    });
    console.log("Sorted rankings:", sortedRankings);

    return sortedRankings;
  }, [selectedTab]);

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
  //     console.log("Fetching rankings...");
  //     const response = await fetch(
  //       `/api/db-rankings?sort=${selectedTab?.key}&page=${currentPage}&limit=${pagination.itemsPerPage}`,
  //     );
  //     if (!response.ok) {
  //       throw new Error("Failed to fetch rankings");
  //     }
  //     const data: ApiResponse = await response.json();
  //     console.log("Ranking data:", data);

  //     console.log("Fetching user details...");

  //     // Fetch user details one by one
  //     const fetchUserDetails = async (fid: number | null | undefined): Promise<User | null> => {
  //       if (fid == null) {
  //         console.warn(`Skipping fetch for null or undefined FID`);
  //         return null;
  //       }

  //       try {
  //         const userResponse = await fetch(`/api/neynar-users?fids=${fid}`);
  //         if (!userResponse.ok) {
  //           console.warn(`Failed to fetch user details for FID ${fid}`);
  //           return null;
  //         }
  //         const userData: { users: User[] } = await userResponse.json();
  //         return userData.users[0] || null;
  //       } catch (error) {
  //         console.error(`Error fetching user details for FID ${fid}:`, error);
  //         return null;
  //       }
  //     };

  //     // Filter out null or undefined FIDs before fetching
  //     const validFids = data.data.filter(ranking => ranking.fid != null).map(ranking => ranking.fid);
  //     const userDetailsPromises = validFids.map(fetchUserDetails);
  //     const userDetailsResults = await Promise.all(userDetailsPromises);

  //     console.log("User details results:", userDetailsResults);

  //     // Combine ranking data with user details, skipping users without Neynar details
  //     const enrichedRankings: EnrichedRankingData[] = data.data.reduce((acc, ranking) => {
  //       const userDetails = userDetailsResults.find(details => details?.fid === ranking.fid);
  //       if (userDetails) {
  //         acc.push({
  //           ...ranking,
  //           userDetails,
  //         });
  //       }
  //       return acc;
  //     }, [] as EnrichedRankingData[]);

  //     const filteredAndSortedRankings = filterAndSortRankings(enrichedRankings);
  //     setAllRankings(filteredAndSortedRankings);

  //     let userRankingIndex = -1;
  //     const rankingsWithoutCurrentUser = filteredAndSortedRankings.filter((ranking, index) => {
  //       if (ranking.walletAddress?.toLowerCase() === address?.toLowerCase()) {
  //         userRankingIndex = index;
  //         return false;
  //       }
  //       return true;
  //     });

  //     // Assign continuous ranks to displayed rankings
  //     const displayedRankingsWithRanks = rankingsWithoutCurrentUser.map((ranking, index) => ({
  //       ...ranking,
  //       displayRank: index >= userRankingIndex ? index + 2 : index + 1
  //     }));

  //     setDisplayedRankings(displayedRankingsWithRanks);

  //     // Update pagination based on displayed rankings
  //     const newTotalItems = displayedRankingsWithRanks.length;
  //     const newTotalPages = Math.ceil(newTotalItems / pagination.itemsPerPage);
  //     setFilteredPagination({
  //       ...pagination,
  //       totalItems: newTotalItems,
  //       totalPages: newTotalPages,
  //       currentPage: Math.min(currentPage, newTotalPages),
  //     });

  //     // Set user ranking
  //     if (userRankingIndex !== -1) {
  //       setUserRanking({
  //         ...filteredAndSortedRankings[userRankingIndex],
  //         rank: userRankingIndex + 1,
  //       } as UserRank);
  //     } else {
  //       setUserRanking(null);
  //     }

  //   } catch (error) {
  //     console.error("Error fetching data:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchRankings = async () => {
    setLoading(true);
    try {
      console.log("Fetching rankings...");
      const response = await fetch(
        `/api/db-rankings?sort=${selectedTab?.key}&page=${currentPage}&limit=${pagination.itemsPerPage}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch rankings");
      }
      const data: ApiResponse = await response.json();
      console.log("Ranking data:", data);

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
      const enrichedRankings: EnrichedRankingData[] = data.data.map(ranking => {
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

        return {
          ...ranking,
          userDetails,
          fid: ranking.fid || null,
          walletAddress: ranking.walletAddress || null,
          tgUsername: ranking.tgUsername || null,
        };
      });

      const filteredAndSortedRankings = filterAndSortRankings(enrichedRankings);
      setAllRankings(filteredAndSortedRankings);

      let userRankingIndex = -1;
      const rankingsWithoutCurrentUser = filteredAndSortedRankings.filter((ranking, index) => {
        if (ranking.walletAddress?.toLowerCase() === address?.toLowerCase()) {
          userRankingIndex = index;
          return false;
        }
        return true;
      });

      // Assign continuous ranks to displayed rankings
      const displayedRankingsWithRanks = rankingsWithoutCurrentUser.map((ranking, index) => ({
        ...ranking,
        displayRank: index >= userRankingIndex ? index + 2 : index + 1
      }));

      setDisplayedRankings(displayedRankingsWithRanks);

      // Update pagination based on displayed rankings
      const newTotalItems = displayedRankingsWithRanks.length;
      const newTotalPages = Math.ceil(newTotalItems / pagination.itemsPerPage);
      setFilteredPagination({
        ...pagination,
        totalItems: newTotalItems,
        totalPages: newTotalPages,
        currentPage: Math.min(currentPage, newTotalPages),
      });

      // Set user ranking
      if (userRankingIndex !== -1) {
        setUserRanking({
          ...filteredAndSortedRankings[userRankingIndex],
          rank: userRankingIndex + 1,
        } as UserRank);
      } else {
        setUserRanking(null);
      }

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
        await fetchRankings();
        if (currentPage === 1) {
          await fetchUserRanking();
        } else {
          setUserRanking(null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedTab, currentPage, pagination.itemsPerPage]);

  // Adjust page numbers calculation based on filtered pagination
  const maxVisiblePages = 15;
  const halfVisiblePages = Math.floor(maxVisiblePages / 2);

  let startPage = Math.max(filteredPagination.currentPage - halfVisiblePages, 1);
  const endPage = Math.min(
    startPage + maxVisiblePages - 1,
    filteredPagination.totalPages
  );

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(endPage - maxVisiblePages + 1, 1);
  }

  const pageNumbers = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // exclude the current user from the rankings

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
      <div className="mx-auto mt-6 w-fit lg:hidden">
        <div className="relative inline-block">
          <select
            value={selectedTab?.key}
            className="w-full appearance-none rounded-lg bg-[#31AE7A] px-2 py-2 text-sm font-medium text-[#FFFC00]"
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

      {/* <p className="my-8 text-sm font-medium text-B-40 lg:text-[22px]">
        Highest amount of points distributed by Brens.
      </p> */}

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
            <>
              {filteredPagination.currentPage === 1 && userRanking && userRanking[selectedTab?.key as keyof UserRank] !== 0 && (
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
                    <a
                      href={`https://warpcast.com/${userRanking.userDetails?.username || ""}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-B-60 lg:text-lg"
                    >
                      {userRanking.userDetails?.username ||
                        `${userRanking.walletAddress?.slice(0, 6)}...${userRanking.walletAddress?.slice(-4)}`}
                    </a>
                  </div>
                  <p className="text-center text-xs text-B-60 lg:text-base">
                    {(userRanking[
                      selectedTab?.key as keyof UserRank
                    ] as number) || 0}
                  </p>
                </div>
              )}
              {displayedRankings
                .slice(
                  (filteredPagination.currentPage - 1) * filteredPagination.itemsPerPage,
                  filteredPagination.currentPage * filteredPagination.itemsPerPage
                )
                .map((ranking, index) => {
                  const rankNumber =
                    (filteredPagination.currentPage - 1) * filteredPagination.itemsPerPage + index + 1;
                  return (
                    <div
                      className="grid w-full grid-cols-[40px_60px_1fr_90px] items-center gap-4 px-3 py-2.5 lg:grid-cols-[60px_200px_1fr_284px] lg:gap-20 lg:px-8 lg:py-5"
                      key={ranking.fid}
                    >
                      <h1 className="text-center text-xs text-B-60 lg:text-lg">
                        {String(ranking.displayRank).padStart(2, "0")}
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
                        <a
                          href={`https://warpcast.com/${ranking.userDetails?.username || ""}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-xs text-B-60 lg:text-lg"
                        >
                          {ranking.userDetails?.username ||
                            `${ranking.walletAddress?.slice(0, 6)}...${ranking.walletAddress?.slice(-4)}`}
                        </a>
                      </div>
                      <p className="text-center text-xs text-B-60 lg:text-base">
                        {(ranking[
                          selectedTab?.key as keyof EnrichedRankingData
                        ] as number) || 0}
                      </p>
                    </div>
                  );
                })}
            </>
          )}
        </div>
      </div>
      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        {filteredPagination.totalPages > 1 && (
          <div className="flex items-center">
            {startPage > 1 && (
              <>
                <PaginationButton
                  page={1}
                  isActive={false}
                  onClick={() => handlePageChange(1)}
                />
                {startPage > 2 && <span className="mx-1">...</span>}
              </>
            )}

            {pageNumbers.map((page) => (
              <PaginationButton
                key={page}
                page={page}
                isActive={page === filteredPagination.currentPage}
                onClick={() => handlePageChange(page)}
              />
            ))}

            {endPage < filteredPagination.totalPages && (
              <>
                {endPage < filteredPagination.totalPages - 1 && <span className="mx-1">...</span>}
                <PaginationButton
                  page={filteredPagination.totalPages}
                  isActive={false}
                  onClick={() => handlePageChange(filteredPagination.totalPages)}
                />
              </>
            )}
          </div>
        )}
        <span className="ml-4 text-sm text-gray-500">
          {`${(filteredPagination.currentPage - 1) * filteredPagination.itemsPerPage + 1}-${Math.min(filteredPagination.currentPage * filteredPagination.itemsPerPage, filteredPagination.totalItems)} of ${filteredPagination.totalItems}`}
        </span>
      </div>
    </div>
  );
};

export default LeaderboardListing;
