import { type AppType } from "next/app";
import "~/styles/font.css";
import "~/styles/globals.css";
import Layout from "./_components/layout";

import "@rainbow-me/rainbowkit/styles.css";
import { RainbowWalletProvider } from "~/utils/rainbowConfig";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <RainbowWalletProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </RainbowWalletProvider>
  );
};

export default MyApp;
