<script>
import { mapGetters, mapActions } from 'vuex';

export default {
    data() {
        return {
            accountHasProfile: false,
            image: null,
            avatar: '',
            display_name: '',
            status: '',
            bio: '',
            is_verified: 0,
            saving: false,
            account: null,
            privateKey: null,
            checkInterval: null,
            clearInterval: null,
            connected: false,
            confirm: false,
            keyView: false,
        };
    },
    computed: {
        ...mapGetters('account', ['isAuthenticated', 'accountName']),
        ...mapGetters('global', ['footerHeight']),
        availableHeight() {
            return (
                window.innerHeight - (this.isAuthenticated ? this.footerHeight : 0)
            );
        },
        userAvatar() {
            if (this.avatar) {
                return this.avatar;
            }

            return '/profile/default_avatar.svg';
        },
    },
    methods: {
        ...mapActions('account', ['accountExists', 'getUserProfile', 'logout']),
        upload(file, p) {
            var fd = new FormData();
            fd.append('image', file); // Append the file

            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'https://api.imgur.com/3/image'); // Boooom!
            xhr.setRequestHeader('Authorization', 'Client-ID b3386c312851443');
            xhr.onload = function () {
                p.avatar = JSON.parse(xhr.responseText).data.link;
            };
            xhr.send(fd).then();
        },
        onPickFile() {
            this.$refs.fileInput.click();
        },
        onFilePicked(event) {
            const files = event.target.files;
            let filename = files[0].name;
            const fileReader = new FileReader();
            this.upload(files[0], this);
        },
        async loadUserProfile() {
            await this.getUserProfile(this.accountName);

            const accountProfile =
        this.$store.state.account.profiles[this.accountName];
            if (!accountProfile) {
                return;
            }

            this.accountHasProfile = true;
            this.avatar = accountProfile.avatar;
            this.bio = accountProfile.bio;
            this.status = accountProfile.status;
            this.display_name = accountProfile.display_name;
            this.is_verified = accountProfile.is_verified;
        },
        async save() {
            const accountProfile =
        this.$store.state.account.profiles[this.accountName];
            const actions = [];
            if (!accountProfile) {
                actions.push({
                    account: 'profiles',
                    name: 'newprofile',
                    data: {
                        account: this.accountName,
                        display_name: this.display_name,
                        avatar: this.avatar,
                        bio: this.bio,
                        status: this.status,
                    },
                });
            } else {
                if (accountProfile.avatar !== this.avatar) {
                    actions.push({
                        account: 'profiles',
                        name: 'editavatar',
                        data: {
                            account: this.accountName,
                            new_avatar: this.avatar,
                        },
                    });
                }
                if (accountProfile.display_name !== this.display_name) {
                    actions.push({
                        account: 'profiles',
                        name: 'editdisplay',
                        data: {
                            account: this.accountName,
                            new_display_name: this.display_name,
                        },
                    });
                }
                if (accountProfile.bio !== this.bio) {
                    actions.push({
                        account: 'profiles',
                        name: 'editbio',
                        data: {
                            account: this.accountName,
                            new_bio: this.bio,
                        },
                    });
                }
                if (accountProfile.status !== this.status) {
                    actions.push({
                        account: 'profiles',
                        name: 'editstatus',
                        data: {
                            account: this.accountName,
                            new_status: this.status,
                        },
                    });
                }
            }
            if (actions.length > 0) {
                this.saving = true;
                try {
                    const transaction = await this.$store.$api.signTransaction(
                        actions,
                        `${!accountProfile ? this.$t('settings.create_profile') : this.$t('settings.update_profile')}`,
                    );
                    this.$successNotification(`${
                        !accountProfile
                            ? this.$t('settings.create_profile_ok')
                            : this.$t('settings.update_profile_ok')
                    }`);
                } catch (error) {
                    this.$errorNotification(error);
                }
            }
            this.saving = false;
        },
        copyToClipboard(str) {
            var el = document.createElement('textarea');
            el.value = str;
            el.setAttribute('readonly', '');
            el.style = { display: 'none' };
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);

            this.$successNotification(this.$t('settings.copied_ok'));
        },
    },
    created: async function () {
        await this.loadUserProfile();
    },
    async mounted() {
        await this.loadUserProfile();
        this.checkInterval = setInterval(async () => {
            this.account = this.$store.$account.account;
            this.privateKey = this.$store.$account.privateKey;
        }, 50);
    },
    async beforeUnmount() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        if (this.clearInterval) {
            clearInterval(this.clearInterval);
        }
    },

    watch: {
        async accountName() {
            await this.loadUserProfile();
        },
    },
};
</script>

<template>
<div class="pageContainer row justify-center">
    <!-- <login-button v-if="isAuthenticated" style="display: none" /> -->
    <div class="text-center">
        <q-list
            round
            flat
            dense
            class="text-white"
            icon="west"
        >
            <!-- <div class="profile text-white flex-center desktop-only">
          <label style="height: 10px">Profile</label>
        </div> -->
            <!-- User Avatar -->
            <div class="row flex-center relative q-mt-xl">
                <!-- <video
            autoplay
            loop
            class="userAvatar"
            style="width: 400px; background: #00000000"
          >
            <source
              class="flex-center"
              src="~assets/Telos-template.mp4"
              type="video/mp4"
              style="width: 300px; background: #00000000"
            />
          </video>
          <div class="overlay" style="width: 100%; height: 100%;"></div> -->

                <div class="userAvatar">
                    <img :src="userAvatar" >
                    <!-- <q-avatar size="10rem" color="transparent" text-color="white">
            </q-avatar> -->
                </div>

                <!-- </q-container> -->
                <q-item class="justify-center uploadImage">
                    <q-btn
                        :style="`height: 2.5rem; width: 2.5rem; border-radius: 10rem; border: 0.010rem solid white;`"
                        @click="onPickFile"
                    >
                        <q-icon name="add_a_photo" color="white" />
                    </q-btn>
                    <input
                        ref="fileInput"
                        type="file"
                        accept="image/*"
                        class="file-input"
                        @change="onFilePicked"
                    >
                </q-item>
            </div>

            <!-- Upload Image Button -->

            <div class="profileInformation">
                <!-- Avatar Name -->
                <q-item>
                    <div avatar>
                        <img
                            class="profileInformationIcons"
                            src="~assets/profile/avatarImg.svg"
                        >
                    </div>
                    <q-input
                        v-model="avatar"
                        dense
                        standout="bg-transparent text-white"
                        label-color="white"
                        color="white"
                        input-class="text-white"
                        class="round-sm full-width"
                        label="Avatar URL"
                    />
                </q-item>

                <!-- Name -->
                <q-item>
                    <div avatar>
                        <img
                            class="profileInformationIcons"
                            src="~assets/profile/nameImg.svg"
                        >
                    </div>
                    <q-input
                        v-model="display_name"
                        dense
                        standout="bg-transparent text-white"
                        label-color="white"
                        color="white"
                        input-class="text-white"
                        class="round-sm full-width"
                        label="Name"
                        :rules="[(val) => !!val || $t('forms.errors.required')]"
                        hide-bottom-space
                    />
                </q-item>

                <!-- Status -->
                <q-item>
                    <div avatar>
                        <img
                            class="profileInformationIcons"
                            src="~assets/profile/statusImg.svg"
                        >
                    </div>
                    <q-input
                        v-model="status"
                        dense
                        standout="bg-transparent text-white"
                        label-color="white"
                        color="white"
                        input-class="text-white"
                        class="round-sm full-width"
                        :label="$t('settings.status')"
                    />
                </q-item>

                <!-- Bio -->
                <q-item>
                    <div avatar>
                        <img
                            class="profileInformationIcons"
                            src="~assets/profile/bioImg.svg"
                        >
                    </div>
                    <q-input
                        v-model="bio"
                        dense
                        standout="bg-transparent text-white"
                        label-color="white"
                        color="white"
                        input-class="text-white"
                        class="round-sm full-width"
                        :label="$t('settings.bio')"
                    />
                </q-item>
            </div>

            <!-- Save Button -->
            <q-item class="row q-gutter-x-sm">
                <q-btn
                    class="settingBtn col"
                    rounded
                    :label="$t('settings.save')"
                    :disable="display_name.length === 0"
                    @click="save"
                />
            </q-item>
        </q-list>

        <q-dialog v-model="confirm" persistent>
            <q-card class="popupCard">
                <q-card-section class="row items-center">
                    <span class="q-mx-auto text-h5">{{$t('settings.warning')}}</span>
                    <span class="q-mx-auto text-center">
                        {{$t('settings.warning_msg')}}
                    </span>
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn
                        v-close-popup
                        flat
                        label="Cancel"
                        color="white"
                    />
                    <q-btn
                        flat
                        label="Yes, I'm sure"
                        color="white"
                        @click="
                            confirm = false;
                            keyView = true;
                        "
                    />
                </q-card-actions>
            </q-card>
        </q-dialog>

        <q-dialog v-model="keyView">
            <q-card class="popupCard">
                <q-card-section>
                    <div class="text-h6">{{$t('settings.private_key')}}</div>
                </q-card-section>
                <q-card-section class="q-pt-none text-center private-key">
                    {{ privateKey }}
                    <q-btn
                        flat
                        dense
                        size="sm"
                        icon="far fa-copy"
                        @click="copyToClipboard(privateKey)"
                    />
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn
                        v-close-popup
                        flat
                        label="Close"
                        color="white"
                    />
                </q-card-actions>
            </q-card>
        </q-dialog>

        <div
            v-if="saving"
            class="justify-center absolute flex full-width full-height spinner"
        >
            <q-spinner-dots class="q-my-auto" color="primary" size="40px" />
        </div>
    </div>
</div>
</template>

<style lang="scss" scoped>
.file-input {
    display: none;
}

.private-key {
    word-break: break-all;
}

.spinner {
    top: 0;
    left: 0;
    background: rgba(0, 0, 0, 0.4);
}

.settingBtn {
  background: #2e1f4f;
  padding: 0.5rem;
}

.pageContainer {
  height: 100vh;
  display: grid;
  place-content: center;
}

.uploadImage {
  background-repeat: no-repeat;
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;
  border-bottom-left-radius: unset;
  border-bottom-left-radius: unset;
  margin-left: 5rem;
  margin-top: 5rem;
  position: absolute;
}

.userAvatar {
  height: clamp(5rem, 20vh, 10rem);
  border-radius: 50%;
  overflow: hidden;
  img {
    height: 100%;
  }
}

.profileInformation {
  margin-top: 1rem;
  max-width: 25rem;
  .profileInformationIcons {
    height: 2.5rem;
    width: 2.5rem;
    margin-right: 15px;
  }
}
</style>
