// Set environment variables used for Jest included as setup in jest.config.js
process.env.CHAIN_NAME = 'telos';
process.env.HYPERION_ENDPOINT = 'http://example.com';

// adds the 'fetchMock' global variable and rewires 'fetch' global to call 'fetchMock' instead of the real implementation
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('jest-fetch-mock').enableMocks();
// changes default behavior of fetchMock to use the real 'fetch' implementation and not mock responses
// fetchMock.dontMock()

