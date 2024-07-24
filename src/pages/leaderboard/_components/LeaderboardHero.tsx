import React from "react";

const LeaderboardHero = () => {
  return (
    <section className="h-[400px] w-full bg-Y-100 pt-[160px] lg:h-[600px] lg:pt-[200px]">
      <main className="hero-section relative mx-auto h-full overflow-x-hidden px-5 lg:max-w-[1600px] lg:px-[60px]">
        <div className="pt-[60px] lg:pl-[140px] lg:pt-[80px]">
          <h1 className="mb-3 text-2xl font-bold text-pu-100 lg:mb-8 lg:text-[60px]">
            Leaderboard
          </h1>

          <p className="max-w-[660px] text-sm leading-tight text-pu-100 lg:text-[28px]">
            Climb the ranks of Based Recognition. The Bren leaderboard showcases
            not only Bren recipients but also top performers in various
            categories.
          </p>
        </div>
      </main>
    </section>
  );
};

export default LeaderboardHero;
