<script>
import { mapGetters } from 'vuex';
import LoginButton from 'components/LoginButton.vue';

export default {
    name: 'HomePage',
    data() {
        return {
            slide: 'slide1',
        };
    },
    components: { LoginButton },
    computed: {
        ...mapGetters('account', ['isAuthenticated']),
    },
};
</script>

<template>
<q-page class="column justify-center items-center content-center">
    <div class="text-center q-pb-md text-h1">{{$t('home.title')}}</div>
    <div class="text-h5 text-center q-pb-lg">{{$t('home.subtitle')}}</div>
    <div v-if="!isAuthenticated" class="text-center">
        <LoginButton />
    </div>
    <q-footer bordered>
        <q-toolbar class="bg-dark">
            <div class="fit column wrap justify-center items-center content-center">
                <div>
                    <a
                        href="https://www.telos.net/terms-of-service"
                        target="_blank"
                        class="text-white"
                    >
                        {{$t('home.terms')}}
                    </a>
                </div>
                <div>
                    <a
                        href="https://www.telos.net/privacy-policy"
                        target="_blank"
                        class="text-white"
                    >
                        {{$t('home.privacy')}}
                    </a>
                </div>
            </div>
        </q-toolbar>
    </q-footer>
</q-page>
</template>

<style scoped>
a {
}
</style>
