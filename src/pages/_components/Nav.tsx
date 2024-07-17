import { useConnectModal, useAccountModal, useChainModal } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { walletFormat } from "~/utils/walletFormat";

const Nav = () => {
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const data = useAccount()


  const Navlinks = [
    { title: "about", link: "#" },
    { title: "leaderboard", link: "#" },
    { title: "my profile", link: "#" },
    { title: "faqs", link: "#" },
  ];
  return (
    <nav className="mx-auto w-full lg:max-w-[1600px]">
      <div className="flex items-center justify-between px-5 pt-10 lg:px-[60px]">
        <Image width={90} height={30} src="/icons/logo.svg" alt="Bren" />

        <div className="hidden space-x-4 lg:block">
          {Navlinks?.map((link) => (
            <Link
              href={link?.link}
              key={link?.title}
              className="text-xl font-medium text-pu-100"
            >
              {link?.title}
            </Link>
          ))}
        </div>

        {
          !data.address &&
          <button
            onClick={openConnectModal}
            className="w-[200px] rounded-[10px] border-[1.5px] border-pu-100 px-6 py-[13px] text-xl font-medium text-pu-100">
            Connect Wallet
          </button>
        }

        {
          !!data.address &&
          <button
            onClick={openAccountModal}
            className="w-[200px] rounded-[10px] border-[1.5px] border-pu-100 px-6 py-[13px] text-xl font-medium text-pu-100">
            {walletFormat(data.address)}
          </button>
        }
      </div>
    </nav>
  );
};

export default Nav;
