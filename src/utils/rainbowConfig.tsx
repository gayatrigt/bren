import { ReactNode } from 'react';
import {
    getDefaultConfig,
    RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
    base,
    Chain
} from 'wagmi/chains';
import {
    QueryClientProvider,
    QueryClient,
} from "@tanstack/react-query";

// Custom Base chain with your RPC URL
const customBase: Chain = {
    ...base,
    rpcUrls: {
        ...base.rpcUrls,
        default: {
            http: ['https://base-mainnet.g.alchemy.com/v2/bh2cJYDWOuGInPIDaFfmCQgtWHEGUaoE'],
        },
        public: {
            http: ['https://base.llamarpc.com'],
        },
    },
};

const config = getDefaultConfig({
    appName: 'Bren',
    projectId: 'YOUR_PROJECT_ID',
    chains: [customBase],
    ssr: true, // If your dApp uses server side rendering (SSR)
});

const queryClient = new QueryClient();

export const RainbowWalletProvider: React.FC<{ children?: ReactNode }> = ({ children }) => (
    <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
                {children}
            </RainbowKitProvider>
        </QueryClientProvider>
    </WagmiProvider>
);