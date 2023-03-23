import {
    getCoingeckoUsdPrice,
    getCoingeckoPriceChartData,
    getEmptyPriceChartData,
} from 'src/api/price';

export const api = {
    getCoingeckoUsdPrice,
    getCoingeckoPriceChartData,
    getEmptyPriceChartData,
};

let _useAntelopeLib = localStorage.getItem('useAntelopeLib') === 'true';
export const setUseAntelopeLib = (value: boolean) => {
    _useAntelopeLib = value;
    localStorage.setItem('useAntelopeLib', value ? 'true' : 'false');
};
export const useAntelopeLib = () => _useAntelopeLib;
