import { ethers } from 'ethers';
import { useEVMStore, usePlatformStore } from 'src/antelope';

export const checkNetwork = async (): Promise<ethers.providers.Web3Provider | void> => {
    if (usePlatformStore().isMobile){
        return;
    }
    const provider = await useEVMStore().ensureProvider();
    let webProvider = new ethers.providers.Web3Provider(provider);
    webProvider = await useEVMStore().ensureCorrectChain(webProvider);
    return webProvider;
};
