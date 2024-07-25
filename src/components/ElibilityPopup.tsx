import React, { useState, useEffect } from 'react';

interface PopupProps {
    isOpen: boolean;
    onClose: () => void;
    address: string;
}

const Popup: React.FC<PopupProps> = ({ isOpen, onClose, address }) => {
    const [loading, setLoading] = useState(true);
    const [eligibilityData, setEligibilityData] = useState<{ isEligible: boolean, message: string, link: string } | null>(null);

    useEffect(() => {
        if (!address || address === "") {
            setEligibilityData({
                isEligible: false,
                message: "Please Connect Wallet",
                link: "" // No link when wallet is not connected
            });
            setLoading(false);
        } else
            if (isOpen && address) {
                setLoading(true);
                fetch(`/api/checkEligibility?address=${address}`)
                    .then(response => response.json())
                    .then(data => {
                        setEligibilityData(data);
                        setLoading(false);
                    })
                    .catch(error => {
                        console.error('Error checking eligibility:', error);
                        setLoading(false);
                    });
            }
    }, [isOpen, address]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-sm px-8 py-4 bg-white border-4 border-black shadow-[8px_8px_0px_#BD44D9] relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-black hover:text-gray-700"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <div className="mt-4">
                    {loading ? (
                        <p>Checking eligibility...</p>
                    ) : eligibilityData ? (
                        <>
                            <h1 className="text-2xl mb-4">{eligibilityData.message}</h1>
                            {address && eligibilityData.link && (
                                <div className="flex justify-center">
                                    <a
                                        href={eligibilityData.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-24 rounded border border-black bg-white py-3 text-xs font-bold
                                    text-pu-100 shadow-[4px_4px_0px_0px_#000] lg:w-32 lg:text-base text-center
                                    hover:bg-gray-100 transition-colors duration-200"
                                    >
                                        {eligibilityData.isEligible ? 'Tip Now' : 'Get Invite'}
                                    </a>
                                </div>
                            )}

                        </>
                    ) : (
                        <p>Error checking eligibility. Please try again.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Popup;