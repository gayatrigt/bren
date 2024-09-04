import Head from "next/head";
import React from "react";
import FaqHero from "./_components/FaqHero";
import FaqListing from "./_components/FaqListing";

const FAQSPage = () => {
  const FAQs = [
    {
      question: "What is $bren?",
      answer:
        "$bren is a onchain point system that rewards for various onchain activities. Currently we are live on Farcaster and Telegram where users can tip and recognize others for their based contributions using points and personalized shoutouts, fostering a culture of appreciation and collaboration.",
    },
    {
      question: "How do I join $bren?",
      answer:
        "To join $bren, you need to be allowlisted, this is based on your Farcaster contributions, $BUILD onchain actions or receive an invitation from an existing user. Once approved, connect your wallet, and start engaging with the community.",
    },
    {
      question: "What are the based values?",
      answer:
        "The based values are integrity, teamwork, tenacity, creativity, and optimism. These values guide the behavior and contributions of the $bren community.",
    },
    {
      question: "How does the leaderboard work?",
      answer:
        "The $bren leaderboard showcases top performers in categories like highest points received/given and most shoutouts received/given. It updates in real-time based on user activity, encouraging friendly competition and engagement.",
    },
    {
      question: "Can I convert $bren points to actual tradeable tokens?",
      answer:
        "At the moment, there are no plans for $bren to be tradeable, however we are always keen to partner with other farcaster token communities on collaborative ventures.",
    },
    {
      question: "How often can I tip other users with $bren?",
      answer:
        "You can tip other users as often as you like, as long as you have sufficient $bren points in your balance. Keep in mind that there may be certain limitations based on your user tier and the number of new people you can recognize each week.",
    },
    {
      question: "What happens if I run out of $bren points?",
      answer:
        "If you run out of $bren points, wait for your weekly allocation to refresh. The amount depends on your tier and consistency in recognizing others. Stay active and engage to increase your chances of getting more points.",
    },
    {
      question: "Can I see the full history of my $bren transactions?",
      answer:
        "Yes, you can view your complete $bren transaction history, including tips sent/received and shoutouts given/earned. This transparency ensures all recognition is tracked and accounted for within the ecosystem.",
    },
    {
      question: "How can I increase my chances of being recognized by others?",
      answer:
        "To increase your chances of being recognized, actively contribute to the base ecosystem by being Based. Embody the values of integrity, teamwork, tenacity, creativity, and optimism to attract recognition naturally.",
    },
    {
      question: "Is there a way to redeem $bren points for rewards?",
      answer:
        "Currently, $bren points are a virtual representation of recognition within the Base & Farcaster ecosystem. However, we are exploring partnerships and integrations to allow redemption for rewards, experiences, or NFTs in the future.",
    },
    {
      question:
        "Will there be any additional features or enhancements to $bren in the future?",
      answer:
        "Absolutely! We are constantly exploring ways to enhance the $bren experience and provide more value for brens. Some potential future features include APIs to build ontop of $bren, recognition collectibles, and integration with other popular platforms. We encourage our community to share their ideas and feedback to help shape the future of $bren.",
    },
  ];
  return (
    <>
      <Head>
        <title>$bren FAQs</title>
        <meta name="description" content="Checkout the $bren tippings" />
        <link rel="icon" href="/icon-bren.png" />
        <meta property="fc:frame" content="vNext" />
        <meta property="og:image" content={``} />
      </Head>
      <FaqHero />

      <section className="mx-auto mt-[54px] w-full px-5 lg:max-w-[1600px] lg:px-[60px]">
        <div className="mx-auto w-full max-w-[888px] divide-y divide-B-100 rounded-xl border border-B-100 lg:rounded-3xl">
          {FAQs?.map((faq) => <FaqListing {...faq} key={faq?.question} />)}
        </div>
      </section>
    </>
  );
};

export default FAQSPage;
