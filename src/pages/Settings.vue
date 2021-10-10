<template>
  <div class="profile flex-center" :style="` display:flex; overflow: auto; height: 100vh !important; background: linear-gradient(to bottom, #020039, #2a3f7e 200%)`">
    <div>
      <div class="profile text-white flex-center">
      <label style="height: 70px; margin-bottom: 80px">Profile</label>
      </div>
      <q-list class="q-py-md">

<!-- Back Button -->
        <q-item class="backBtn" >
          <q-btn round flat @click="$router.replace('/balance')">
            <q-icon name="chevron_left" color="white" />
          </q-btn>
        </q-item>



<!-- User Avatar -->
        <div class="flex-center relative" style="display:flex;"  >
          
          <video autoplay loop class="userAvatar" style="width: 400px; background: #00000000">
            <source   class="flex-center" src="~assets/test.webm" type="video/webm" style="width: 300px; background: #00000000" >
          </video>
          <div class="overlay" style="width: 100%; height: 100%;"></div>
          <!-- Save Button -->
          <q-item class= "saveBtn text-white userAvatar">
            <q-btn text-color="white" :style="`height: 35px; background: #2e1f4f;  border-radius: 10rem; text-decoration-color: white;`"
              label="SAVE" @click="save" :disable="display_name.length === 0"
            />
          </q-item>
        
          <q-item class="justify-center userAvatar">
            <q-avatar size="100px" font-size="52px" color="transparent" text-color="white">
              <!-- <img :src="userAvatar" style="border: 1px solid purple"/> -->
              <img style="border: 1px solid purple" src="~assets/default_avatar.svg"/>
            </q-avatar>
          </q-item>
          
          <!-- </q-container> -->
          <q-item class="justify-center uploadImage" >
            <q-btn :style="`height: 2.5rem; width: 2.5rem; border-radius: 10rem; border: 0.010rem solid white;`"
              @click="onPickFile">
              <q-icon name="add_a_photo" color="white" />
            </q-btn>
            <input type="file" ref="fileInput" accept="image/*" 
              style="display: none" @change="onFilePicked"
            />
          </q-item>
          
        </div>

<!-- Upload Image Button -->
        

    <div class="profileInformation">
<!-- Avatar Name -->
        <q-item style="height: 70px;">
          <img class="profileImg" src="~assets/avatarImg.svg" style="margin-top: 10px;">
          <q-input v-model="avatar" dense border  standout="text-white" label-color="white"  color="white" input-class="text-white" borderless filled 
            class="round-sm full-width" label="Avatar URL"
          />
        </q-item>

<!-- Name -->
          <q-item style="height: 70px; margin-top: 18.4px">
            <img class="profileImg" src="~assets/nameImg.svg" style="margin-top: 5px; margin-bottom: 0px; padding-bottom: 18.4px">
            <q-input v-model="display_name" dense border  standout="text-white" label-color="white"  color="white" input-class="text-white" borderless filled
              class="round-sm full-width" label="Name"
              :rules="[val => !!val || 'This field is required']"
            /> 
          </q-item>

<!-- Status -->
          <q-item style="height: 70px;">
            <img class="profileImg" src="~assets/statusImg.svg">
            <q-input v-model="status" dense border standout="text-white" label-color="white"  color="white" input-class="text-white" borderless filled
              class="round-sm full-width" label="Status"
            />
          </q-item>

<!-- Bio -->
          <q-item style="height: 70px;">
            <img class="profileImg" src="~assets/bioImg.svg">
            <q-input v-model="bio" dense border standout="text-white" label-color="white"  color="white" input-class="text-white" borderless filled
              class="round-sm full-width" label="Bio"
            />
          </q-item>
      </div>

<!-- Google label -->
        <div class="flex-center" style="position: relative; display:flex; left: 1rem; top: 1rem; bottom: 0rem" >
          <p class="googleAccount text-white">Google account is connected | <b> Private Key</b></p>
          <img src="~assets/googleBlock.svg">
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
    display: flex;
    block-size: auto;
    align-self: center;
    
}

.saveBtn{
  border-radius: 6rem;
}

.profile{
  display: flex;
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
  margin-left: 5rem;
  margin-top: 5rem;
  position:absolute;
}

.userAvatar{
  position:absolute;
}

.avatarBackground{
  display: flex;
  position: relative;
  left: center;
  margin-bottom: 6rem;
  margin-left: 4rem;
  top: -2rem;
}

.profileInformation{
  margin-top: 100px;
  /* width: auto; */
  /*left: 50%; */
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
   z-index: 5;
}

.nameImg{
  margin: 1rem 1.5rem 1rem;
}

.googleAccount{
  position: absolute;
  margin-top: 2rem;
  display: block;
  text-decoration-color: white;
  font-size: 0.95rem;
  margin-bottom: 2rem;
  
}

.googleBlock{
}

.backBtn{
  text-align: center;
  left: 30%;
  top: 0;
  height: 4rem; 
  width: 4rem;
  position: absolute;
}

.overlay {
  position: absolute; 
  /* display: none; Hidden by default */
  width: 100%; /* Full width (cover the whole page) */
  height: 100%; /* Full height (cover the whole page) */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #020039aa; /* Black background with opacity */
  z-index: 0; /* Specify a stack order in case you're using a different order for other elements */
  /* cursor: pointer; */
}

</style>