

// -------- Feedback store --------
const FeedbackGetters = {
    isLoading: jest.fn().mockImplementation(() => false),
};

const FeedbackActions = {
    setDebug: jest.fn(),
    setLoading: jest.fn(),
    unsetLoading: jest.fn(),
};

const FeedbackStore = { ...FeedbackGetters, ...FeedbackActions };

const useFeedbackStore = jest.fn().mockImplementation(() => FeedbackStore);

const createTraceFunction = jest.fn().mockImplementation(() => jest.fn());

const isTracingAll = jest.fn().mockImplementation(() => false);


export {
    FeedbackStore,
    FeedbackGetters,
    FeedbackActions,
    useFeedbackStore,
    createTraceFunction,
    isTracingAll,
};
