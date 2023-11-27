

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

jest.mock('src/antelope/stores/feedback', () => ({
    useFeedbackStore,
}));

export {
    FeedbackStore,
    FeedbackGetters,
    FeedbackActions,
    useFeedbackStore,
};
