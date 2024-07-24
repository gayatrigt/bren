import {
  useConnectModal,
  useAccountModal,
  useChainModal,
} from "@rainbow-me/rainbowkit";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { cn } from "~/utils/helpers";
import { walletFormat } from "~/utils/walletFormat";
import classNames from 'classnames';  // Make sure to import classnames library

const Nav = () => {
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const data = useAccount();
  const { pathname } = useRouter();

  const Navlinks = [
    { title: "about", link: "/" },
    { title: "leaderboard", link: "/leaderboard" },
    { title: "faqs", link: "/faqs" },
  ];

  // Add "my profile" link only when user is connected
  if (data.address) {
    Navlinks.splice(2, 0, { title: "my profile", link: "/profile" });
  }

  const [showMenu, setShowMenu] = useState(false);

  // ... in your component
  const isMobile = useMediaQuery('(max-width: 640px)');  // You'll need to implement this hook

  const buttonClasses = classNames({
    'py-2 text-base px-2': isMobile,  // Mobile classes
    'w-[200px] py-[13px] px-6 text-lg': !isMobile,  // Desktop classes
    'rounded-[10px] border-[1.5px] border-pu-100 font-medium text-pu-100': true,  // Common classes
  });

  const walletFormat = (address: string, chars = 6) => {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  };

  return (
    <nav className="relative">
      <div className="fixed left-0 right-0 top-0 z-30 w-full backdrop-blur-[12px]">
        <nav className="mx-auto w-full lg:max-w-[1600px]">
          <div className="flex items-center justify-between px-5 pb-2 pt-5 lg:px-[60px] lg:pt-10 max-w-full">
            <div className="flex items-center space-x-2">
              <Image
                src="/icons/hamburger.svg"
                alt="Menu"
                width={24}
                height={24}
                className="block cursor-pointer lg:hidden"
                onClick={() => setShowMenu(true)}
              />
              <Image width={90} height={30} src="/icons/logo.svg" alt="Bren" />
            </div>

            <div className="hidden space-x-4 lg:block">
              {Navlinks?.map((link) => (
                <Link
                  href={link?.link}
                  key={link?.title}
                  className={cn(
                    "nav-link relative text-xl font-medium text-pu-100",
                    {
                      "active-link": pathname === link?.link,
                    },
                  )}
                >
                  {link?.title}
                </Link>
              ))}
            </div>

            {
              !data.address &&
              <button
                onClick={openConnectModal}
                className={buttonClasses}                >
                Connect Wallet
              </button>
            }
            {
              !!data.address &&
              <button
                onClick={openAccountModal}
                className={buttonClasses}                >
                {walletFormat(data.address)}
              </button>
            }

          </div>
        </nav>
      </div>

      {showMenu && (
        <div className="fixed bottom-0 left-0 right-0 z-40 flex h-screen w-full flex-col bg-white pb-14 lg:hidden">
          <div className="flex items-center justify-between bg-Y-100 px-5 pb-12 pt-[54px]">
            <h1 className="text-2xl text-pu-100">Menu</h1>

            <Image
              src="/icons/close_icon.svg"
              alt="close"
              width={24}
              height={24}
              className="cursor-pointer"
              onClick={() => {
                setShowMenu(false);
              }}
            />
          </div>

          <div className="flex h-full flex-col px-5">
            <div className="mobile-menu-globe relative z-10 mb-2 flex h-full flex-col space-y-3 py-8">
              {Navlinks?.map((link) => (
                <Link
                  href={link?.link}
                  key={link?.title}
                  className="text-pu-100"
                  onClick={() => setShowMenu(false)}
                >
                  {link?.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Nav;


function useMediaQuery(query: any) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [matches, query]);

  return matches;
}
