export interface HyperionAbiSignatureFilter {
    type?: string;
    hex?: string;
}

export interface HyperionActionsFilter {
    page?: number;
    skip?: number;// skip overrides `page`
    limit?: number;
    account?: string;
    notified?: string;
    sort?: 'desc' | 'asc';
    after?: string;
    before?: string;
    extras?: { [key: string]: string };
    address?: string;
    block?: string;
    hash?: string;
}

export interface IndexerTransactionsFilter {
    address: string;
    limit?: number; // integer value to limit number of results
    offset?: number; // integer value to offset the results of the query
    includeAbi?: boolean; // indicate whether to include abi
    sort?: 'DESC' | 'ASC'; // sort transactions by id (DESC or ASC)
    includePagination?: boolean; // include the total count and more flag in response
    logTopic?: string; // match to the transaction logs' first topic
    full?: string; // Add internal transactions to the response
}

