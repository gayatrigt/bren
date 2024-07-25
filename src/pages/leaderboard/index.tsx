import Head from "next/head";
import React from "react";
import LeaderboardHero from "./_components/LeaderboardHero";
import LeaderboardListing from "./_components/LeaderboardListing";

const LeaderboardPage = () => {
  return (
    <>
      <Head>
        <title>$bren Leaderboard</title>
        <meta name="description" content="Checkout the $bren tippings" />
        <link rel="icon" href="/icon-bren.png" />
        <meta property="fc:frame" content="vNext" />
        <meta property="og:image" content={``} />
      </Head>
      <div>
        <LeaderboardHero />
        <LeaderboardListing />
      </div>
    </>
  );
};

export default LeaderboardPage;
