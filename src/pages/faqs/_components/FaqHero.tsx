import React from "react";

const FaqHero = () => {
  return (
    <section className="h-[300px] w-full bg-Y-100 pt-[160px] lg:h-[600px] lg:pt-[200px]">
      <main className="hero-section relative mx-auto h-full overflow-x-hidden px-5 lg:max-w-[1600px] lg:px-[60px]">
        <div className="flex h-full items-center pt-[30px] lg:pl-[140px] lg:pt-[50px]">
          <h1 className="mb-3 hidden text-2xl font-bold leading-tight text-pu-100 lg:mb-8 lg:block lg:text-[60px]">
            Frequently Asked <br />
            Questions (FAQs)
          </h1>

          <h1 className="mb-3 text-2xl font-bold text-pu-100 lg:hidden">
            FAQs
          </h1>
        </div>
      </main>
    </section>
  );
};

export default FaqHero;
