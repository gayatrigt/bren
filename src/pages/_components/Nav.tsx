import Image from "next/image";
import Link from "next/link";
import React from "react";

const Nav = () => {
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

        <button className="w-[200px] rounded-[10px] border-[1.5px] border-pu-100 px-6 py-[13px] text-xl font-medium text-pu-100">
          Connect Wallet
        </button>
      </div>
    </nav>
  );
};

export default Nav;
