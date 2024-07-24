"use client";
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

const Nav = () => {
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const data = useAccount();
  const { pathname } = useRouter();

  const Navlinks = [
    { title: "about", link: "/" },
    { title: "leaderboard", link: "/leaderboard" },
    { title: "my profile", link: "/profile" },
    { title: "faqs", link: "/faqs" },
  ];
  const [showMenu, setShowMenu] = useState(false);

  const openMenu = () => {
    setShowMenu(true);
    document.body.style.overflow = "hidden";
  };

  const closeMenu = () => {
    setShowMenu(false);
    document.body.style.overflow = "";
  };

  return (
    <nav className="relative">
      <div className="fixed left-0 right-0 top-0 z-30 w-full backdrop-blur-[12px]">
        <nav className="mx-auto w-full lg:max-w-[1600px]">
          <div className="flex items-center justify-between px-5 pb-2 pt-5 lg:px-[60px] lg:pt-10">
            <div className="flex items-center gap-3">
              <Image
                src="/icons/hamburger.svg"
                alt="Menu"
                width={20}
                height={13}
                className="block cursor-pointer lg:hidden"
                onClick={openMenu}
              />

              <div className="relative h-[24px] w-[60px] lg:h-[30px] lg:w-[90px] ">
                <Image layout="fill" src="/icons/logo.svg" alt="Bren" />
              </div>
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

            <button className="hidden w-[200px] rounded-[10px] border-[1.5px] border-pu-100 px-6 py-[13px] text-xl font-medium text-pu-100 lg:block">
              Connect Wallet
            </button>

            <button className="w-[105px] rounded-[6px] border-[1.5px] border-pu-100 py-[6px] text-xs font-medium text-pu-100 lg:hidden">
              Connect Wallet
            </button>
          </div>
        </nav>
      </div>

      {showMenu && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex h-screen w-full flex-col bg-white pb-14 lg:hidden">
          <div className="flex items-center justify-between bg-Y-100 px-5 pb-12 pt-[54px]">
            <h1 className="text-2xl text-pu-100">Menu</h1>

            <Image
              src="/icons/close_icon.svg"
              alt="close"
              width={24}
              height={24}
              className="cursor-pointer"
              onClick={closeMenu}
            />
          </div>

          <div className="flex h-full flex-col px-5">
            <div className="mobile-menu-globe relative z-10 mb-2 flex h-full flex-col space-y-3 py-8">
              {Navlinks?.map((link) => (
                <Link
                  href={link?.link}
                  key={link?.title}
                  className="text-pu-100"
                  onClick={closeMenu}
                >
                  {link?.title}
                </Link>
              ))}
            </div>

            <button className="mt-auto flex-shrink-0 rounded-[10px] border-[1.5px] border-B-100 bg-white py-[13px]">
              <span className="text-sm font-medium">0xabcdef...uwvxyz</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Nav;
