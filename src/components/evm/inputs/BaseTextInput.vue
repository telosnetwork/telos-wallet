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
        // gives the input a yellow warning state
        warning: {
            type: Boolean,
            default: false,
        },
        // gives the input a yellow warning state
        warningText: {
            type: String,
            default: '',
        },
        // gives the input a green success state
        success: {
            type: Boolean,
            default: false,
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
                requiredRule.push((val: string) => (val?.length ?? 0) > 0 || this.$t('forms.errors.required'));
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
                hint: this.warning ? this.warningText : this.hint,
                color: '',
                labelColor: '',
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
        inputIcon(): string {
            if (this.error) {
                return '';
            } else if (this.warning) {
                return 'warning';
            } else if (this.success) {
                return 'check';
            } else {
                return '';
            }
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
<div
    :class="{
        'c-base-input': true,
        'c-base-input--warning': warning,
        'c-base-input--success': success,
        'c-base-input--error': error,
        'q-mb-sm': true,
    }"
>
    <q-input
        ref="input"
        :model-value="modelValue"
        :reactive-rules="true"
        v-bind="inputElementBindings"
        outlined
        stack-label
        @update:modelValue="handleChange"
        @blur="this.isDirty = true"
    >
        <template #append>
            <q-icon
                v-if="inputIcon"
                :name="inputIcon"
            />
            <slot v-else name="append"></slot>
        </template>

    </q-input>
</div>
</template>

<style lang="scss">
.c-base-input {
    $this: &;

    // quasar overrides
    .q-field__label {
        margin-left: 4px;
    }

    &--error {
        .q-field__messages,
        .q-field__label,
        .q-icon {
            @include error-text;
        }

        .q-field--outlined {
            .q-field__control::before {
                border-color: var(--negative-color);
            }
        }

        .q-field--outlined.q-field--highlighted {
            .q-field__control::after {
                border-color: var(--negative-color);
            }
        }
    }

    &--warning:not(#{$this}--error) {
        .q-field__messages,
        .q-field__label {
            @include warning-text;
        }

        .q-icon {
            color: var(--warning-color-ui);
        }

        .q-field--outlined {
            .q-field__control::before {
                border-color: var(--warning-color-ui);
            }
        }

        .q-field--outlined.q-field--highlighted {
            .q-field__control::after {
                border-color: var(--warning-color-ui);
            }
        }
    }

    &--success:not(#{$this}--error):not(#{$this}--warning) {
        .q-field__messages,
        .q-field__label,
        .q-icon {
            @include positive-text;
        }

        .q-field--outlined {
            .q-field__control::before {
                border-color: var(--positive-color);
            }
        }

        .q-field--outlined.q-field--highlighted {
            .q-field__control::after {
               border-color: var(--positive-color);
            }
        }
    }
}
</style>
