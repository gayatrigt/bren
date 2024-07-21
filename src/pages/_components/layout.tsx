import React from "react";
import Nav from "./Nav";
import Footer from "./Footer";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="flex min-h-screen flex-col">
      <Nav />
      <main className="-mt-[100px]">{children}</main>
      <Footer />
    </main>
  );
};

export default Layout;
