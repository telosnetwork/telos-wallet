export interface HyperionAbiSignatureFilter {
    type?: string;
    hex?: string;
}

export interface HyperionActionsFilter {
    page?: number; // the page variable sustitutes the skip
    skip?: number;
    limit?: number;
    account?: string;
    notified?: string;
    sort?: 'desc' | 'asc';
    after?: string;
    before?: string;
    extras?: { [key: string]: string };
    //
    address?: string;
    block?: string;
    hash?: string;
}

