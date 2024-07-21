import Head from "next/head";
import React from "react";
import ProfileHero from "./_components/ProfileHero";

const ProfilePage = () => {
  return (
    <>
      <Head>
        <title>$bren Profile</title>
        <meta name="description" content="Checkout the $bren tippings" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="fc:frame" content="vNext" />
        <meta property="og:image" content={``} />
      </Head>
      <ProfileHero />
      <section className="mx-auto mt-[54px] w-full px-5 lg:max-w-[1600px] lg:px-[60px]">
        <div className="grid items-stretch gap-4 lg:grid-cols-3 lg:gap-8">
          <div className="border-B-12 rounded-[32px] border bg-[rgba(43,0,53,0.04)] px-10 py-[60px] ">
            <h1 className="mb-3 text-xl text-pu-100">Bren Cred</h1>
            <h2 className="text-[48px] font-bold text-pu-100">200</h2>
            <p className="mt-3 text-xl text-pu-100">
              Total points earned from shoutouts given and received, as well as
              your onchain reputation.
            </p>
            <button className="mt-4 rounded-lg border border-pu-100 p-[14px] font-medium">
              How cred works
            </button>
          </div>
          <div className="border-B-12 rounded-[32px] border bg-[rgba(43,0,53,0.04)] px-10 py-[60px] ">
            <h1 className="mb-3 text-xl text-pu-100">Weekly Allocation</h1>
            <h2 className="text-[48px] font-bold text-pu-100">500</h2>
            <p className="mt-3 text-xl text-pu-100">
              Based on your bren cred, frequency of shoutouts and contributions
              of your invites.
            </p>
            <button className="mt-4 rounded-lg border border-pu-100 p-[14px] font-medium">
              How allocation works
            </button>
          </div>
          <div className="border-B-12 rounded-[32px] border bg-[rgba(43,0,53,0.04)] px-10 py-[60px] ">
            <h1 className="mb-3 text-xl text-pu-100">Invites</h1>
            <h2 className="text-[48px] font-bold text-pu-100">20</h2>
            <p className="mt-3 text-xl text-pu-100">
              Number of based frens you’ve invited to the bren network.
            </p>
            <button className="mt-4 rounded-lg border border-pu-100 p-[14px] font-medium">
              How invites work
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default ProfilePage;
