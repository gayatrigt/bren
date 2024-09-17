import Head from "next/head";
import React, { useEffect, useState } from "react";
import ProfileHero from "./_components/ProfileHero";
import { useAccount } from "wagmi";
import { db } from "~/server/db";

export interface UserData {
  weeklyAllowance: boolean
  invites?: number
  brenPoints?: number
  name?: string
  username?: string
  pfpUrl?: string
  fid?: number
}

const ProfilePage = () => {
  const { address } = useAccount();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/getUserDetails-db?address=${address}`);
        if (!response.ok) {
          if (response.status === 404) {
            setUserData(null);
          } else {
            throw new Error('Failed to fetch user data');
          }
          return;
        }
        const data = await response.json();
        setUserData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [address]);

  if (loading) {
    return <div>
      <ProfileHero heroText={`Loading`} />
      <section className="mx-auto mt-[54px] w-full px-5 lg:max-w-[1600px] lg:px-[60px]">
        <div className="grid items-stretch gap-4 lg:grid-cols-3 lg:gap-8">
          <div className="border-B-12 rounded-[32px] border bg-[rgba(43,0,53,0.04)] px-10 py-[60px] ">
            <h1 className="mb-3 text-xl text-pu-100">Bren Cred</h1>
            <h2 className="text-[48px] font-bold text-pu-100">Calculating...</h2>
            <p className="mt-3 text-xl text-pu-100">
              Total points earned from shoutouts given to you by other Brens.
            </p>
          </div>
        </div>
      </section>
    </div>;
  }

  if (!address) {
    return (
      <>
        <Head>
          <title>$bren Profile</title>
          <meta name="description" content="Checkout the $bren tippings" />
          <link rel="icon" href="/icon-bren.png" />
          <meta property="fc:frame" content="vNext" />
          <meta property="og:image" content={``} />
        </Head>
        <ProfileHero heroText="Please connect wallet" />
      </>
    );
  }

  if (!userData) {
    return (
      <>
        <Head>
          <title>$bren Profile</title>
          <meta name="description" content="Checkout the $bren tippings" />
          <link rel="icon" href="/icon-bren.png" />
          <meta property="fc:frame" content="vNext" />
          <meta property="og:image" content={``} />
        </Head>
        <ProfileHero heroText="You are not active in Bren system yet" />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>$bren Profile</title>
        <meta name="description" content="Checkout the $bren tippings" />
        <link rel="icon" href="/icon-bren.png" />
        <meta property="fc:frame" content="vNext" />
        <meta property="og:image" content={``} />
      </Head>
      <ProfileHero heroText={`${userData.name} Stats`} />
      <section className="mx-auto mt-[54px] w-full px-5 lg:max-w-[1600px] lg:px-[60px]">
        <div className="grid items-stretch gap-4 lg:grid-cols-3 lg:gap-8">
          <div className="border-B-12 rounded-[32px] border bg-[rgba(43,0,53,0.04)] px-10 py-[60px] ">
            <h1 className="mb-3 text-xl text-pu-100">Bren Cred</h1>
            <h2 className="text-[48px] font-bold text-pu-100">{userData.brenPoints}</h2>
            <p className="mt-3 text-xl text-pu-100">
              Total points earned from shoutouts given to you by other Brens.
            </p>
          </div>
          {userData.weeklyAllowance && (
            <div className="border-B-12 rounded-[32px] border bg-[rgba(43,0,53,0.04)] px-10 py-[60px] ">
              <h1 className="mb-3 text-xl text-pu-100">Weekly Allocation</h1>
              <h2 className="text-[48px] font-bold text-pu-100">300</h2>
              {/* <p className="mt-3 text-xl text-pu-100">
                Based on your bren cred, frequency of shoutouts and contributions
                of your invites.
              </p> */}
            </div>
          )}
          {/* {userData.invites !== undefined && (
            <div className="border-B-12 rounded-[32px] border bg-[rgba(43,0,53,0.04)] px-10 py-[60px] ">
              <h1 className="mb-3 text-xl text-pu-100">Invites</h1>
              <h2 className="text-[48px] font-bold text-pu-100">{userData.invites}</h2>
              <p className="mt-3 text-xl text-pu-100">
                Number of based frens you have invited to the bren network.
              </p>
            </div>
          )} */}
        </div>
      </section>
    </>
  );
};

export default ProfilePage;