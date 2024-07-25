import { Transaction } from "@prisma/client";
import { NextPage } from "next";
import Hero from "~/components/Hero";
import SectionOne from "~/components/SectionOne";
import SectionThree from "~/components/SectionThree";
import SectionTwo from "~/components/SectionTwo";
const Home: NextPage<{ transactions: Transaction[] }> = (props) => {
  return (
    <>
      <section className="w-full">
        <Hero />
        <SectionOne />
        <SectionTwo />
        <SectionThree />
      </section>
    </>
  );
};

export default Home;
