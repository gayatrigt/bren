import Image from "next/image";
import Nav from "./Nav";

const Hero = () => {
  const mindsetList = [
    {
      title: "Integrity",
      description: "Do the right thing, even if it’s hard.",
    },
    {
      title: "Teamwork",
      description: "Put the team over the individual.",
    },
    {
      title: "Tenacity",
      description: "Work hard and persevere.",
    },
    {
      title: "Creativity",
      description: "Push boundaries with innovative ideas.",
    },
    {
      title: "Optimism",
      description: "Stay positive and optimistic in the face of challenges.",
    },
  ];
  return (
    <div className="min-h-screen w-full bg-Y-100">
      <Nav />
      <section className="hero-globe relative mx-auto mt-10 w-full overflow-x-hidden px-5 lg:h-[850px] lg:max-w-[1600px] lg:px-[60px]">
        <section className="relative z-[5] mx-auto flex h-[510px] w-full flex-col justify-center lg:h-[700px] lg:max-w-[1200px]">
          <h1 className="mb-2 stroke-pu-100 text-[32px] font-bold leading-tight text-pu-100 lg:mb-4 lg:text-[60px]">
            Recognize <br className="lg:hidden" />
            your <br className="hidden lg:block" />
            Base <br className="lg:hidden" />
            frens with Bren
          </h1>
          <h2 className="mb-3 text-base leading-tight text-pu-100 lg:mb-5 lg:text-[28px] ">
            Reward based contributions <br className="lg:hidden" />
            to the onchain <br className="hidden lg:block" />
            economy by <br className="lg:hidden" />
            sending $bren and shoutouts
          </h2>
          <button className="w-[125px] rounded border border-p-100 bg-white py-3 text-xs font-bold text-pu-100 shadow-[8px_8px_0px_0px_#BD44D9] lg:w-[210px] lg:py-4 lg:text-lg">
            Check Eligibility
          </button>
        </section>
      </section>
      <section className="hero-champ relative mx-auto -mt-20 w-full overflow-x-hidden px-5 lg:max-w-[1600px] lg:px-[60px]">
        <section className="relative z-[5] mx-auto mb-20 w-full max-w-[1200px] rounded-[24px] bg-[rgba(43,0,53,0.04)] px-6 py-10 shadow-[0px_0px_8px_0px_rgba(17,16,17,0.08)] lg:px-[100px] lg:py-20">
          <h1 className="mb-1 text-center text-base font-bold text-pu-100 lg:mb-2 lg:text-[40px]">
            Embrace the Based Mindset
          </h1>

          <p className="mb-4 text-center text-xs text-pu-100 lg:mb-12 lg:text-[22px]">
            BREN is built upon a set of core values that define the based
            mindset
          </p>
          <div className="grid gap-5 lg:grid-cols-[380px_1fr] lg:gap-12">
            <div className=" flex w-full items-center justify-center rounded-xl bg-pu-100">
              <div className="relative h-auto w-[360px]">
                <img src="/icons/tweet_1.png" alt="Tweet" className="object-contain" />
              </div>
            </div>
            <div className="space-y-3 lg:space-y-5">
              {mindsetList?.map((item) => (
                <div key={item?.title} className="gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-1 bg-pu-100" />
                    <h1 className="text-xs font-bold lg:text-2xl">
                      {item?.title}
                    </h1>
                  </div>
                  <p className="ml-3 text-[10px] text-[#2B003599] lg:text-xl">
                    {item?.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>
    </div>
  );
};

export default Hero;
