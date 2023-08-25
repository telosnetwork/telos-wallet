import { debounceAsync } from 'src/antelope/stores/utils/store-utils';

describe('debounceAsync', () => {
    let asyncMethodCallCounter = 0;
    let synchronousMethodCallCounter = 0;
    const returnValue = 'resolved';

    // this method represents an async method, like a network request, which will be called from within
    // a function we want to debounce, such as a store action which fetches data
    function someAsyncMethod(param: string): Promise<string> {
        return new Promise((resolve) => {
            asyncMethodCallCounter++;
            resolve(returnValue.concat(param));
        });
    }

    // this method represents a synchronous method, like a getter, which will be called from within
    // a function we want to debounce, such as a store getter which returns data
    function someNonAsyncMethod(param: string): string {
        synchronousMethodCallCounter++;
        return returnValue.concat(param);
    }

    beforeAll(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllTimers();
        asyncMethodCallCounter = 0;
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('should throw an error if the wait time is not a positive integer', () => {
        const errorMessage = 'Invalid wait time. Wait time must be a positive integer.';
        expect(() => debounceAsync(someAsyncMethod, -1)).toThrow(errorMessage);
        expect(() => debounceAsync(someAsyncMethod, 0)).toThrow(errorMessage);
        expect(() => debounceAsync(someAsyncMethod, 1.5)).toThrow(errorMessage);
    });

    it('should prevent a function from being called more than once within the specified timeframe', async () => {
        const debouncedMethod = debounceAsync(someAsyncMethod, 1000);

        // this is the first call to the debounced method; this call should be debounced (i.e. the async method should not be called)
        // because the second call below to the debounced method is made within the specified timeframe
        const firstCall = debouncedMethod('one');

        // advance timer by 100ms, which is still within the specified debounce timeframe
        // so, the async method should have been called yet
        jest.advanceTimersByTime(100);
        expect(asyncMethodCallCounter).toBe(0);

        // this is the second call to the debounced method; this call should also be debounced (i.e. the async method should not be called)
        const secondCall = debouncedMethod('two');
        jest.advanceTimersByTime(100);
        expect(asyncMethodCallCounter).toBe(0);

        // this call will be the last one before the debounce timeframe expires, so the async method should be called 1000ms after it is called
        const thirdCall = debouncedMethod('three');
        jest.advanceTimersByTime(100);
        // 1000ms have not yet passed, so the async method should not have been called yet
        expect(asyncMethodCallCounter).toBe(0);

        jest.advanceTimersByTime(1000);
        // 1000ms have passed, so the async method should have been called once
        expect(asyncMethodCallCounter).toBe(1);

        // ultimately, all of the promises should resolve to the same value - the value passed to the last call to the debounced method
        expect(await firstCall).toBe(returnValue.concat('three'));
        expect(await secondCall).toBe(returnValue.concat('three'));
        expect(await thirdCall).toBe(returnValue.concat('three'));
    });

    it('should return correctly even if the function provided is not asynchronous', async () => {
        const debouncedMethod = debounceAsync(someNonAsyncMethod, 1000);
        const firstCall = debouncedMethod('one');
        jest.advanceTimersByTime(100);

        // the synchronous method should not have been called yet, because the debounce timeframe has not yet expired
        expect(synchronousMethodCallCounter).toBe(0);

        const secondCall = debouncedMethod('two');
        jest.advanceTimersByTime(100);
        // the synchronous method should not have been called yet, because the debounce timeframe has not yet expired
        expect(synchronousMethodCallCounter).toBe(0);

        jest.advanceTimersByTime(3000);
        // the synchronous method should have been called once, because the debounce timeframe has expired
        expect(synchronousMethodCallCounter).toBe(1);

        expect(await firstCall).toBe(returnValue.concat('two'));
        expect(await secondCall).toBe(returnValue.concat('two'));
    });
});
