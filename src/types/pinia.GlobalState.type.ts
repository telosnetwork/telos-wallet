// Description: GlobalState type for pinia store
export interface GlobalState {
    footer_height: number;
    min_space: number;
    max_space: number;
    suggest_tokens: Array<{
        contract: string;
        sym: string;
    }>;
    support_tokens: string[];
    p_tokens: string[];
    p_token_networks: {
        [key: string]: {
            telos?: string;
            tevm?: string;
            ethereum?: string;
            ptoken?: string;
        };
    };
}
