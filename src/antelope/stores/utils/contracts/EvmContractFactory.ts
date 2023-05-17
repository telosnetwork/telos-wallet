import { erc1155Abi, erc20Abi, erc721Abi } from 'src/antelope/stores/utils/abi';
import { EvmContract2, EVMContractFactoryData } from 'src/antelope/stores/utils/contracts/EvmContract';
import { AntelopeError, ContractCalldata, ContractMetadata2 } from 'src/antelope/types';

export default class EVMContractFactory {
    buildContract(data: EVMContractFactoryData): EvmContract2 {
        if (!data || !data.address) {
            throw new AntelopeError('antelope.contracts.contract_data_required');
        }

        let verified = false;
        if (typeof data.abi !== 'undefined' && data.abi.length > 0) {
            data.abi = (typeof data.abi === 'string') ? JSON.parse(data.abi) : data.abi;
        } else if (typeof data.metadata !== 'undefined' && data.metadata?.length > 0) {
            const metadata: ContractMetadata2 = JSON.parse(data.metadata);
            data.abi = metadata?.output?.abi;
        }
        if (data.abi) {
            verified = true;
        } else if (data.supportedInterfaces && data.supportedInterfaces.includes('erc20')) {
            data.abi = erc20Abi;
        } else if (data.supportedInterfaces && data.supportedInterfaces.includes('erc721')) {
            data.abi = erc721Abi;
        } else if (data.supportedInterfaces && data.supportedInterfaces.includes('erc1155')) {
            data.abi = erc1155Abi;
        }

        const properties: ContractCalldata = (data.calldata) ? JSON.parse(data.calldata) : {};

        if (!data.name) {
            if(properties?.name){
                data.name = properties.name;
            } else if(data.metadata) {
                const metadata: ContractMetadata2 = JSON.parse(data.metadata);

                if(metadata?.settings?.compilationTarget){
                    data.name = Object.values(metadata?.settings?.compilationTarget)[0];
                }
            }
        }
        const abi = typeof data.abi === 'string' ? JSON.parse(data.abi) : data.abi;

        return new EvmContract2({
            address: data.address,
            name: data.name ?? '',
            verified: verified,
            creationInfo: {
                creator: data.creator,
                transaction: data.transaction,
                block: data.block,
            },
            supportedInterfaces: data.supportedInterfaces ?? [],
            abi,
            properties,
        });
    }
}
