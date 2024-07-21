import { type AppType } from "next/app";
import "~/styles/font.css";
import "~/styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { RainbowWalletProvider } from "~/utils/rainbowConfig";
import Layout from "~/components/layout";

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


