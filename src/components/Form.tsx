import React, { useEffect, useState } from 'react';

interface FormProps {
  allowanceLeft: number;
  text?: string;
  parent?: string;
}

const Form: React.FC<FormProps> = ({ allowanceLeft, text, parent }) => {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [tipAmount, setTipAmount] = useState<number>(Math.ceil(allowanceLeft / 10));
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (text) {
      setMessage(text);
    }
  }, [text]);

  console.log(allowanceLeft)

  const toggleValue = (value: string) => {
    setSelectedValues(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  const handleCast = () => {
    console.log('Selected values:', selectedValues);
    console.log('Tip amount:', tipAmount);
    // Here you can add logic to send the selected values and tip amount to your backend

    setIsLoading(true)
    try {
      const mappedValues = selectedValues.map(value => `#${value}`).join(' ');
      let castText = message ? `${message} ` : '';
      castText += `[mention user] ${tipAmount} $bren ${mappedValues}`;

      const castData: any = {
        text: castText,
      };

      if (parent) {
        castData.parent = parent;
      }

      window.parent.postMessage({
        type: "createCast",
        data: {
          cast: castData
        }
      }, "*");
    } catch (error) {
      console.error('Error creating channel:', error);
    } finally {
      setIsLoading(false)
    }
  };

  const preventDefaultTouch = (e: React.TouchEvent) => {
    e.preventDefault();
  };

  return (
    <div className='flex flex-col items-center w-full max-w-md mx-auto'>
      <div className="w-full mb-8 flex flex-col items-center">
        <p className="text-base text-pu-100 mb-4 text-center">Set the amount of Bren you want to give:</p>
        <div
          className="touch-none w-80 flex flex-col items-center"
          onTouchStart={preventDefaultTouch}
          onTouchMove={preventDefaultTouch}
        >
          <input
            type="range"
            min="0"
            max={allowanceLeft}
            value={tipAmount}
            onChange={(e) => setTipAmount(Number(e.target.value))}
            className="w-full h-5 bg-white rounded-lg appearance-none cursor-pointer slider-thumb"
          />
          <p className="text-center text-md mt-2 text-pu-100 font-bold">{tipAmount}/{allowanceLeft} $bren</p>
        </div>
      </div>
      <p className="text-base text-pu-100 mb-4 text-center">Select the value you want give Bren for:</p>
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {["Integrity", "Optimism", "Creativity", "Tenacity", "Teamwork"].map((value) => (
          <button
            key={value}
            className={`px-4 py-2 rounded-md transition-colors ${selectedValues.includes(value)
              ? 'bg-white text-pu-100 border border-pu-100'
              : 'bg-pu-100 text-white'
              }`}
            onClick={() => toggleValue(value)}
          >
            {value}
          </button>
        ))}
      </div>
      {!isLoading && <button
        className="rounded border border-p-100 bg-white w-32 py-2 font-bold text-pu-100
           shadow-[3px_3px_0px_0px_#000] text-lg hover:bg-pu-100 hover:text-white transition-colors"
        onClick={handleCast}
      >
        Cast
      </button>}
      {isLoading && <div
        className="px-4 h-[40px] flex items-center
                 justify-center rounded border border-p-100 bg-white w-32 py-2 font-bold text-pu-100
           shadow-[3px_3px_0px_0px_#000] text-lgtransition-colors"
      >
        <span className="loader"></span>
      </div>}
    </div>
  );
};

export default Form;