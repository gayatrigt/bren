import { Transaction } from "@prisma/client";
import { NextPage } from "next";
import Head from "next/head";
import { useSearchParams } from "next/navigation";
import Hero from "./_components/Hero";
import SectionOne from "./_components/SectionOne";
import SectionTwo from "./_components/SectionTwo";
import SectionThree from "./_components/SectionThree";
import Footer from "./_components/Footer";

const Home: NextPage<{ transactions: Transaction[] }> = (props) => {
  const queryParams = useSearchParams();
  const tipStatus = encodeURIComponent(queryParams.get("tipStatus")!);
  const statusMsg = encodeURIComponent(queryParams.get("msg")!);
  const mainText = encodeURIComponent(queryParams.get("main")!);

  return (
    <>
      <Head>
        <title>$bren Dashboard</title>
        <meta name="description" content="Checkout the $bren tippings" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="fc:frame" content="vNext" />
        <meta
          property="og:image"
          // content={`https://d4af-49-205-43-209.ngrok-free.app/api/getStatusImg/route?tipStatus=${tipStatus}&msg=${statusMsg}&main=${mainText}`}
          content={``}
        />
        <meta
          property="fc:frame:image"
          content={`${process.env.NEXT_PUBLIC_BASE_URL}/api/getStatusImg/route?tipStatus=${tipStatus}&msg=${statusMsg}&main=${mainText}`}
        />
      </Head>

      <section className="w-full">
        <Hero />
        <SectionOne />
        <SectionTwo />
        <SectionThree />
        <Footer />
      </section>
    </>
  );
};

export default Home;
