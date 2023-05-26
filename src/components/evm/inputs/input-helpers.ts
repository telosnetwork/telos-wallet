// compilation of fallthrough attributes from https://quasar.dev/vue-components/input
import { PropType } from 'vue';

export const quasarInputProps = {
    name: {
        type: String,
        required: true,
    },
    mask: {
        type: String,
        default: undefined,
    },
    fillMask: {
        type: [Boolean, String],
        default: false,
    },
    reverseFillMask: {
        type: Boolean,
        default: false,
    },
    unmaskedValue: {
        type: Boolean,
        default: false,
    },
    error: {
        type: Boolean,
        default: false,
    },
    rules: {
        type: Array as PropType<(() => boolean|string)[]>,
        default: [],
    },
    reactiveRules: {
        type: Boolean,
        default: false,
    },
    lazyRules: {
        type: [Boolean, String],
        default: true,
        validator: (rule: string | boolean) => [true, false, 'ondemand'].includes(rule),
    },
    loading: {
        type: Boolean,
        default: false,
    },
    clearable: {
        type: Boolean,
        default: false,
    },
    autofocus: {
        type: Boolean,
        default: false,
    },
    for: {
        type: String,
        default: '',
    },
    errorMessage: {
        type: String,
        default: '',
    },
    noErrorIcon: {
        type: Boolean,
        default: false,
    },
    label: {
        type: String,
        required: true,
    },
    stackLabel: {
        type: Boolean,
        default: false,
    },
    hint: {
        type: String,
        default: '',
    },
    hideHint: {
        type: Boolean,
        default: false,
    },
    prefix: {
        type: String,
        default: '',
    },
    suffix: {
        type: String,
        default: '',
    },
    clearIcon: {
        type: String,
        default: '',
    },
    labelSlot: {
        type: Boolean,
        default: false,
    },
    bottomSlots: {
        type: Boolean,
        default: false,
    },
    counter: {
        type: Boolean,
        default: false,
    },
    shadowText: {
        type: String,
        default: '',
    },
    autogrow: {
        type: Boolean,
        default: false,
    },
    type: {
        type: String,
        default: 'text',
        validator: (type: string) => [
            'text',
            'password',
            'textarea',
            'email',
            'search',
            'tel',
            'file',
            'number',
            'url',
            'time',
            'date',
        ].includes(type),
    },
    debounce: {
        type: [String, Number],
        default: '',
    },
    maxlength: {
        type: [String, Number],
        default: '',
    },
    disable: {
        type: Boolean,
        default: false,
    },
    readonly: {
        type: Boolean,
        default: false,
    },
};
