<template>
  <div class="column q-mx-md" :style="`max-width: 800px; margin: auto; overflow: auto; height: ${availableHeight}px !important;`">
    <q-list class="q-py-md">
      <q-item class="justify-center">
        <q-avatar size="110px" font-size="52px" color="white" text-color="white">
          <img :src="userAvatar" style="border: 1px solid purple"/>
        </q-avatar>
      </q-item>
      <q-item class="justify-center">
        <q-btn text-color="white" :style="`height: 35px; background: ${themeColor}`"
          label="UPLOAD IMAGE"  @click="onPickFile"
        />
        <input type="file" ref="fileInput" accept="image/*"
          style="display: none" @change="onFilePicked"
        />
      </q-item>
      <q-item>
        <q-input v-model="avatar" dense borderless filled disable
          class="round-sm full-width" maxlength="128" counter label="Avatar URL"
        />
      </q-item>
      <q-item>
        <q-input v-model="display_name" dense borderless filled
          class="round-sm full-width" maxlength="16" counter label="Name"
          :rules="[val => !!val || 'This field is required']"
        /> 
      </q-item>
      <q-item>
        <q-input v-model="status" dense borderless filled
          class="round-sm full-width" maxlength="16" counter label="Status"
        />
      </q-item>
      <q-item class="column">
        <label class="q-mr-auto">Bio</label>
        <q-editor v-model="bio" min-height="5rem" />
      </q-item>
      <q-item>
        <q-btn text-color="white" :style="`height: 35px; background: ${themeColor}`"
          label="SAVE" @click="save" :disable="display_name.length === 0"
        />
      </q-item>
    </q-list>
  </div>
</template>

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
    };
  },
  computed: {
    ...mapGetters('account', ['isAuthenticated', 'accountName']),
    ...mapGetters('global', ['footerHeight']),
    availableHeight() {
      return window.innerHeight - (this.isAuthenticated ? this.footerHeight : 0);
    },
    userAvatar() {
      if (this.avatar) return this.avatar;

      return 'https://images.squarespace-cdn.com/content/54b7b93ce4b0a3e130d5d232/1519987165674-QZAGZHQWHWV8OXFW6KRT/icon.png?content-type=image%2Fpng';
    }
  },
  methods: {
    ...mapActions('account', ['accountExists', 'getUserProfile']),
    upload(file, p) {
      var fd = new FormData();
      fd.append("image", file); // Append the file
     
      var xhr = new XMLHttpRequest();
      xhr.open("POST", "https://api.imgur.com/3/image"); // Boooom!
      xhr.setRequestHeader('Authorization', 'Client-ID b3386c312851443');
      xhr.onload = function() {
        p.avatar = JSON.parse(xhr.responseText).data.link;
      }
      xhr.send(fd).then();
    },
    onPickFile () {
      this.$refs.fileInput.click()
    },
    onFilePicked (event) {
      const files = event.target.files;
      let filename = files[0].name;
      const fileReader = new FileReader();
      this.upload(files[0], this);
    },
    async loadUserProfile() {
      if (!this.$store.state.account.profiles.hasOwnProperty(this.accountName)) {
        await this.getUserProfile(this.accountName);
      }
      const accountProfile = this.$store.state.account.profiles[this.accountName];
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
      const accountProfile = this.$store.state.account.profiles[this.accountName];
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
          }
        });
      } else {
        if (accountProfile.avatar !== this.avatar) {
          actions.push({
            account: 'profiles',
            name: 'editavatar',
            data: {
              account: this.accountName,
              new_avatar: this.avatar,
            }
          });
        }
        if (accountProfile.display_name !== this.display_name) {
          actions.push({
            account: 'profiles',
            name: 'editdisplay',
            data: {
              account: this.accountName,
              new_display_name: this.display_name,
            }
          });
        }
        if (accountProfile.bio !== this.bio) {
          actions.push({
            account: 'profiles',
            name: 'editbio',
            data: {
              account: this.accountName,
              new_bio: this.bio,
            }
          });
        }
        if (accountProfile.status !== this.status) {
          actions.push({
            account: 'profiles',
            name: 'editstatus',
            data: {
              account: this.accountName,
              new_status: this.status,
            }
          });
        }
      }
      if (actions.length > 0) {
        const transaction = await this.$store.$api.signTransaction(actions);
        if (transaction) {
          this.$q.notify({
            type: 'primary',
            message: `${!accountProfile ? 'New profile is created successfully' : 'Profile is updated successfully'}`,
          });
        }
      } else {
        this.$q.notify({
          type: 'primary',
          message: `No change to save`,
        });
      }
    },
  },
  created: async function() {
    this.loadUserProfile();
  }
};
</script>
