import { type AppType } from "next/app";
import "~/styles/font.css";
import "~/styles/globals.css";

import '@rainbow-me/rainbowkit/styles.css';
import { RainbowWalletProvider } from "~/utils/rainbowConfig";


const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <RainbowWalletProvider>
      <main className="">
        <Component {...pageProps} />
      </main>
    </RainbowWalletProvider>
  );
};

export default MyApp;
