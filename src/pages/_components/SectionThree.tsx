import FAQListing from "./FAQListing";

const SectionThree = () => {
  const FAQs = [
    { question: "What is $bren?", answer: "$BRen is a gifting system" },
    { question: "What is $bren?", answer: "$BRen is a gifting system" },
    { question: "What is $bren?", answer: "$BRen is a gifting system" },
  ];
  return (
    <div className="w-full px-5 lg:px-0">
      <div className="mx-auto mt-10 w-full max-w-[1366px] rounded-[20px] bg-[#BD44D9] px-4 py-4 lg:mt-[60px] lg:rounded-[40px] lg:px-[160px] lg:py-[100px]">
        <div className="w-full rounded-md bg-[rgba(17,16,17,0.16)] px-4 py-6 lg:rounded-[24px] lg:px-10 lg:py-12">
          <h1 className="text-center text-xl font-bold text-[#EEEEEE] lg:text-[60px]">
            Bren FAQs
          </h1>

          <div className="mt-3 divide-y divide-W-100 rounded-md border lg:mt-5 lg:rounded-lg">
            {FAQs?.map((faq, i) => <FAQListing {...faq} key={i} />)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionThree;
