<script lang="ts">
import { quasarInputProps } from 'components/evm/inputs/input-helpers';
import { defineComponent } from 'vue';
import { QInput } from 'quasar';

export default defineComponent({
    name: 'BaseTextInput',
    emits: [
        'update:modelValue',
    ],
    props: {
        ...quasarInputProps,
        modelValue: {
            type: String,
            default: null,
        },
    },
    data: () => ({
        isDirty: false,
    }),
    computed: {
        inputElement(): QInput {
            return this.$refs.input as QInput;
        },
        isRequired(): boolean {
            // if the input is required, a value of 0 is considered invalid
            return [true, 'true', 'required'].includes(this.$attrs.required as string | boolean);
        },
        isDisabled(): boolean {
            return [true, 'true', 'disabled'].includes(this.$attrs.disabled as string | boolean) || this.disable;
        },
        isReadonly(): boolean {
            return [true, 'true', 'readonly'].includes(this.$attrs.readonly as string | boolean) || this.readonly;
        },
        inputElementBindings(): Record<string, unknown> {
            let requiredRule = [];

            if (this.isRequired) {
                // eztodo i18n
                requiredRule.push((val: string) => (val?.length ?? 0) > 0 || 'This field is required');
            }

            const mergedRules = [
                ...(this.rules || []),
                ...requiredRule,
            ];

            const quasarProps: Record<string, unknown> = Object.keys(quasarInputProps).reduce(
                (acc, name) => ({
                    [name]: (this.$props as Record<string, unknown>)[name],
                    ...acc,
                }),
                {},
            );

            const hasRequiredError = (this.isRequired && [null, ''].includes(this.modelValue) && this.isDirty);

            const errorMessage: string = hasRequiredError ? 'This field is required' : quasarProps.errorMessage as string;

            const error: boolean = hasRequiredError ? true : quasarProps.error as boolean;

            const filteredAttrs = { ...this.$attrs };
            delete filteredAttrs.size; // size=undefined causes DOM warnings

            const attrs: Record<string, unknown> = {
                ...this.$attrs,
                ...quasarProps,
                errorMessage,
                error,
                disabled: 'disabled',
                readonly: 'readonly',
                required: 'required',
                autocomplete: 'off',
                rules: mergedRules,
                label: `${this.label}${this.isRequired ? '*' : ''}`,
            };

            delete attrs.class;

            if (!this.isDisabled) {
                delete attrs.disabled;
            }

            if (!this.isReadonly) {
                delete attrs.readonly;
            }

            if (!this.isRequired) {
                delete attrs.required;
            }

            return attrs;
        },
    },
    watch: {
        async required(newValue, oldValue) {
            if (newValue !== oldValue) {
                // prevent 'field is required' error from persisting if 'required' prop changes
                await this.inputElement.resetValidation();
            }
        },
    },
    methods: {
        handleChange(newValue: string) {
            if (newValue !== this.modelValue) {
                this.$emit('update:modelValue', newValue);
            }
        },
        async validate() {
            this.inputElement.validate();
        },
        async resetValidation() {
            await this.inputElement.resetValidation();
        },
    },
});
</script>

<template>
<div class="c-base-input q-mx-sm">
    <q-input
        ref="input"
        :model-value="modelValue"
        :reactive-rules="true"
        v-bind="inputElementBindings"
        color="primary"
        @update:modelValue="handleChange"
        @blur="this.isDirty = true"
    >

        <template #append>
            <slot name="append"></slot>
        </template>
    </q-input>
    <q-tooltip
        v-if="readonly"
        anchor="bottom middle"
        self="center right"
    >
        <span class="u-text--pre">{{  $t('components.inputs.readonly') }}</span>
    </q-tooltip>
</div>
</template>
