<script>
import { toSvg } from 'jdenticon';
import { mapGetters } from 'vuex';

export default {
    props: {
        token: {
            type: String,
            default: '',
        },
        avatarSize: {
            type: Number,
            default: 60,
        },
        grayscale: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        identicon() {
            return toSvg(this.token, this.avatarSize);
        },
        avatarStyle() {
            return `width:${this.avatarSize}px; height:${this.avatarSize}px`;
        },
        src() {
            if (this.token === '' || this.token === undefined) {
                return '';
            } else if (this.token.includes('/')) { // If link provided
                return this.token;
            } else {
                // If no link provided
                return '';
            }
        },
    },
};
</script>

<template>
<q-avatar :size="`${avatarSize}px`">
    <q-spinner-puff
        v-if="src === 'Loading'"
        :style="avatarStyle"
        color="primary"
    />
    <q-img
        v-else-if="src"
        :src="src"
        alt="Avatar"
        :style="avatarStyle"
    >
        <template v-slot:error>
            <div class="transparent token-no-padding" v-html="identicon" ></div>
        </template>
        <template v-slot:loading>
            <q-spinner-puff color="primary" :style="avatarStyle" />
        </template>
    </q-img>
    <div v-else v-html="identicon" ></div>
</q-avatar>
</template>

<style lang="scss">
.token-no-padding {
    padding: 0;
}

.grayscale {
  filter: grayscale(100%);
}
</style>
