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
      <div className="flex items-center justify-between pt-10 lg:px-[60px]">
        <Image width={90} height={30} src="/icons/logo.svg" alt="Bren" />

        <div className="space-x-4">
          {Navlinks?.map((link) => (
            <Link
              href={link?.link}
              key={link?.title}
              className="text-pu-100 text-xl font-medium"
            >
              {link?.title}
            </Link>
          ))}
        </div>

        <button className="text-pu-100 border-pu-100 w-[200px] rounded-[10px] border-[1.5px] px-6 py-[13px] text-xl font-medium">
          Connect Wallet
        </button>
      </div>
    </nav>
  );
};

export default Nav;
