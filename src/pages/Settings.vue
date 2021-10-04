<template>
  <div class="container" :style="`max-width: auto; margin: 0%; overflow: auto; height: ${availableHeight}px !important; background: linear-gradient(to bottom, #130C3F, #8946DF 200%)`">
    <div>
      <div class="profile text-white flex-center">
      <label>Profile</label>
      </div>
      <q-list class="q-py-md">

        <!-- Save Button -->
        <q-item class= "saveBtn text-white"  >
          <q-btn text-color="white" :style="`height: 35px; background: #2e1f4f;  border-radius: 5rem; text-decoration-color: white;`"
            label="SAVE" @click="save" :disable="display_name.length === 0"
          />
        </q-item>

        <!-- User Avatar -->
        <div style="position: relative; left: 0; top: 0; align-content: center;"  >
          <img class="avatarVideoBack" src="~assets/avatarVideoBack.svg">
          <img class="avatarBackground" src="~assets/avatarBackground.svg">
          <q-item class="justify-center userAvatar">
            <q-avatar size="110px" font-size="52px" color="white" text-color="white">
              <img :src="userAvatar" style="border: 1px solid purple"/>
          </q-avatar>
        </q-item>
        </div>

        <!-- Upload Image Button -->
        <q-item class="justify-center uploadImage" >
          <q-btn :style="`height: 2.5rem; width: 2.5rem; border-radius: 10rem;`"
            @click="onPickFile">
            <q-icon name="add_a_photo" color="white" />
          </q-btn>
          <!-- <q-btn round class="q-icon material-icons"
            < q-icon name="mail" />
            :style="`height: 2.5rem; width: 2.5rem; border-radius: 10rem;`"
            @click="onPickFile"
          /> -->
          <input type="file" ref="fileInput" accept="image/*"
            style="display: none" @change="onFilePicked"
          />
        </q-item>

    <div class="profileInformation">
        <!-- Avatar Name -->
        <q-item>
          <img class="profileImg" src="~assets/avatarImg.svg">
          <q-input v-model="avatar" 
            class="round-sm full-width" label="Avatar URL"
          />
        </q-item>

        <!-- Name -->
        <q-item>
          <img class="profileImg" src="~assets/nameImg.svg">
          <q-input v-model="display_name" 
            class="round-sm full-width" label="Name"
            :rules="[val => !!val || 'This field is required']"
          /> 
        </q-item>

        <!-- Status -->
        <q-item>
           <img class="profileImg" src="~assets/statusImg.svg">
          <q-input v-model="status" dense border 
            class="round-sm full-width" label="Status"
          />
        </q-item>

        <!-- Bio -->
        <q-item>
            <img class="profileImg" src="~assets/bioImg.svg">
          <q-input v-model="bio" dense border
            class="round-sm full-width text-white" label="Bio"
          />
        </q-item>
    </div>

        <!-- Google label -->
        <div class="container">
          <label class="googleAccount text-white">Google account is connected | Private Key</label>
          <img class="container" src="~assets/googleBlock.svg">
          
        </div>
        
        <!-- <q-item class="column">
          <label class="q-mr-auto information" >Bio</label>
          <q-input v-model="bio" />
        </q-item> -->
      </q-list>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import imgur from 'imgur';

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

<style scoped>
.container {
    /* display: flex; */
    place-content: center;
}

.saveBtn{
  float: right;
  border-radius: 6rem;
  opacity: 100%;
  /* margin-left: -3rem; */
  }

.profile{
  display: flex;
  margin-top: 2rem;
  margin-bottom: 2rem;
  position: center;
  font-weight:normal;
  font-size:large;
}
.uploadImage{
  /* background-image: url("~assets/camera.svg"); */
  background-repeat: no-repeat;
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;
  border-bottom-left-radius: unset;
  border-bottom-left-radius: unset;
  margin-top: -3rem;
  margin-left: 0.1rem;
}

.userAvatar{
  display: flex;
  position:absolute;
  top: 0.5rem;
  left: 0.1rem;
}

.avatarBackground{
  display: flex;
  position: relative;
  top: 0;
  left: 0;
}

.avatarVideoBack{
  display: flex;
  align-content: center;
  position:absolute;
  top: -2.8rem;
  left: -3rem;
}

profileInformation{
  margin-top: 4rem;
}
.clientInformationBlocks{
  display: flex;
}

.settingImg{
  background-color: white;
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;
  border-bottom-left-radius: unset;
  border-bottom-left-radius: unset;
  margin-top: -2.5rem;
  margin-left: 1rem;
}

.profileImg{
  margin: 1rem 1.5rem 1rem;
}

.nameImg{
  margin: 1rem 1.5rem 1rem;
}

.container{
  position: relative;
  justify-content: center;
  align-content: center;
  display: flex;
  margin-left: auto;
  margin-right: auto;
  margin-top: 2rem;
  max-width: auto;
}
.googleAccount{
  position:absolute;
  display: flex;
  text-decoration-color: white;
  height: auto;
  width: auto;
}

.googleBlock{
  justify-content: center;
  align-content: center;
  display: flex;
  margin-left: auto;
  margin-right: auto;
  margin-top: 2rem;
  max-width: auto;

}

@media only screen and (min-width: 1000px) {
 
}

</style>