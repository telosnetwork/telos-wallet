
/**
 * Creates and returns a debounced version of the provided asynchronous function.
 * The debounced function delays invoking the function until after `wait` milliseconds have passed since the last time the debounced function was invoked.
 * Multiple calls within the same "debounce window" will resolve to the same value.
 *
 * @template Context The type of the `this` context the function will be invoked with.
 * @template Args The argument types for the function to be debounced.
 * @template FnReturnType The return type for the function to be debounced.
 *
 * @param {(...args: Args) => Promise<FnReturnType> | FnReturnType} func - The function to debounce. Can return a Promise or a value.
 * @param {number} wait - The number of milliseconds to delay.
 *
 * @throws {Error} If `wait` is not a positive integer.
 *
 * @returns {(...args: Args) => Promise<FnReturnType>} A debounced function.
 *
 * @example
 * let callCounter = 0;
 *
 * function fetchSomeData(address: string) {
 *     callCounter++;
 *     return Promise.resolve(address);
 * }
 *
 * const debouncedFetchSomeData = debounceAsync(fetchSomeData, 1000);
 * const callOne = debouncedFetchSomeData('abc');
 * const callTwo = debouncedFetchSomeData('xyz');
 * const callOneResult = await callOne;
 * const callTwoResult = await callTwo;
 * console.log(callOneResult); // 'xyz'
 * console.log(callTwoResult); // 'xyz'
 * console.log(callCounter); // 1
 */
// eztodo document how this should be used in the context of a store or object, like with the function ()... rather than arrow function
// eztodo remove?
export function debounceAsync<Context, Args extends Array<unknown>, FnReturnType>(
    func: (this: Context, ...args: Args) => Promise<FnReturnType> | FnReturnType,
    wait: number,
): (...args: Args) => Promise<FnReturnType> {

    if (wait % 1 !== 0 || wait <= 0) {
        throw new Error('Invalid wait time. Wait time must be a positive integer.');
    }

    let timeout: ReturnType<typeof setTimeout> | undefined;
    let pendingResolves: Array<(value: FnReturnType) => void> = [];

    return function (this: Context, ...args: Args): Promise<FnReturnType> {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const context = this;
        clearTimeout(timeout);

        return new Promise<FnReturnType>((resolve) => {
            pendingResolves.push(resolve);

            timeout = setTimeout(async () => {
                const result = await func.apply(context, args);

                // Resolve all pending promises
                pendingResolves.forEach(pendingResolve => pendingResolve(result));

                // Clear the pendingResolves array
                pendingResolves = [];

                // clean up the timeout
                clearTimeout(timeout);
                timeout = undefined;
            }, wait);
        });
    };
}
