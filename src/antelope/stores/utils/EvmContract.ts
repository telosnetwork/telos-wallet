import { ethers } from 'ethers';
import { markRaw } from 'vue';
import { ExternalProvider } from '@ethersproject/providers';
import {
    AntelopeError,
    EvmABI,
    EvmContractCreationInfo,
    EvmContractData,
    EvmContractManagerI,
    EvmFormatedLog,
    EvmLog,
    EvmLogs,
    EvmToken,
    TRANSFER_SIGNATURES,
} from 'src/antelope/types';


export default class EvmContract {

    constructor({ address, creationInfo, name, abi, manager, token, verified }: EvmContractData) {
        this.address = address;
        this.name = name;
        this.manager = manager;
        if (abi){
            this.abi = abi;
            this.iface = markRaw(new ethers.utils.Interface(abi as EvmABI));
        }
        if (token){
            this.token = token;
        }
        this.verified = verified ?? false;
        this.sources = [];
        this.creationInfo = creationInfo;
    }

    public address: string;
    public name: string;
    public abi: EvmABI | null = null;
    public manager: EvmContractManagerI;
    public iface:  ethers.utils.Interface | null = null;
    public token: EvmToken | null = null;
    public verified: boolean;
    public sources: unknown[];
    public creationInfo: EvmContractCreationInfo;
    public contract: ethers.Contract | null = null;


    getName() {
        return this.name;
    }

    setVerified(status: boolean) {
        this.verified = status;
    }

    isVerified() {
        return this.verified;
    }

    getCreationTrx() {
        if (!this.creationInfo) {
            return;
        }

        return this.creationInfo.creation_trx;
    }

    getCreator() {
        if (!this.creationInfo) {
            return;
        }

        return this.creationInfo.creator;
    }

    getContractInstance(provider: ExternalProvider | null = null, createNew = false) {
        if (!this.abi){
            throw new AntelopeError('antelope.utils.error_contract_instance');
        }

        if (!this.contract || createNew) {
            const web3Provider = provider ? new ethers.providers.Web3Provider(provider) : this.manager.getRpcProvider();
            this.contract = new ethers.Contract(this.address, this.abi, web3Provider);
        }
        return this.contract;
    }

    async parseTransaction(data:string) {
        if (this.iface) {
            try {
                return await this.iface.parseTransaction({ data });
            } catch (e) {
                console.error(`Failed to parse transaction data ${data} using abi for ${this.address}`);
            }
        } else {
            try {
                // this functionIface is an interface for a single function signature as discovered via 4bytes.directory... only use it for this function
                const functionIface = await this.manager.getFunctionIface(data);
                if (functionIface) {
                    return functionIface.parseTransaction({ data });
                }
            } catch (e) {
                console.error(`Failed to parse transaction data ${data} using abi for ${this.address}`);
            }
        }
        throw new AntelopeError('antelope.utils.error_parsing_transaction');
    }

    async parseLogs(logs: EvmLogs): Promise<EvmFormatedLog[]> {
        if (this.iface) {
            const iface = this.iface;
            const parsedArray = await Promise.all(logs.map(async (log) => {
                try {
                    const parsedLog:ethers.utils.LogDescription = iface.parseLog(log);
                    return  this.formatLog(log, parsedLog);
                } catch (e) {
                    return this.parseEvent(log);
                }
            }));
            parsedArray.forEach((parsed) => {
                if(parsed.name && parsed.eventFragment?.inputs){
                    parsed.inputs = parsed.eventFragment.inputs;
                }
            });
            return parsedArray;
        }


        return await Promise.all(logs.map(async (log) => {
            const parsedLog = await this.parseEvent(log);
            if(parsedLog.name && parsedLog.eventFragment?.inputs){
                parsedLog.inputs = parsedLog.eventFragment.inputs;
            }
            return parsedLog;
        }));
    }


    formatLog(log: EvmLog, parsedLog: ethers.utils.LogDescription): EvmFormatedLog {
        if(!parsedLog.signature) {
            console.error('No signature found for log! Check if this explodes. Returning EvmLog instead of EvmFormatedLog. ');
            return log as unknown as EvmFormatedLog;
        }
        const function_signature = log.topics[0].substring(0, 10);
        return {
            ... parsedLog,
            function_signature,
            isTransfer: TRANSFER_SIGNATURES.includes(function_signature),
            logIndex: log.logIndex,
            address: log.address,
            token: this.token,
            name: parsedLog.signature,
        } as EvmFormatedLog;
    }

    async parseEvent(log: EvmLog): Promise<EvmFormatedLog> {
        const eventIface = await this.manager.getEventIface(log.topics[0]);
        if (eventIface) {
            try {
                const parsedLog:ethers.utils.LogDescription = eventIface.parseLog(log);
                return this.formatLog(log, parsedLog);
            } catch(e) {
                throw new AntelopeError('antelope.utils.error_parsing_log_event', log);
            }
        } else {
            throw new AntelopeError('antelope.utils.error_parsing_log_event', log);
        }
    }
}
