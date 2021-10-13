<template>
  <div class="profile flex-center main-background-overlay" :style="` display:flex; overflow: auto; height: 100vh !important;`">
    <div>
      
      
      <div class="profile text-white flex-center">
      <label style="height: 70px; margin-bottom: 80px">Profile</label>
      
<!-- Save Button -->
          <q-item class= "saveBtn text-white userAvatar">
            <q-btn text-color="white" :style="`height: 35px; background: #2e1f4f;  border-radius: 10rem; text-decoration-color: white;`"
              label="SAVE" @click="save" :disable="display_name.length === 0"
            />
<!-- Back Button -->
          </q-item>
      </div>     
      <q-list round flat dense class="text-white closebBtn" icon="west">


<!-- User Avatar -->
        <div class="flex-center relative" style="display:flex;"  >
          
          <video autoplay loop class="userAvatar" style="width: 400px; background: #00000000">
            <source   class="flex-center" src="~assets/Telos-template.mp4" type="video/mp4" style="width: 300px; background: #00000000" >
          </video>
          <div class="overlay" style="width: 100%; height: 100%;"></div>

          <q-item class="justify-center userAvatar">
            <q-avatar size="100px" font-size="52px" color="transparent" text-color="white">
              <!-- <img :src="userAvatar" style="border: 1px solid purple"/> -->
              <img style="" src="~assets/default_avatar.svg"/>
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
          <q-input v-model="avatar" 
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
          <q-item style="height: 70px; margin-top: 18.4px">
            <img class="profileImg" src="~assets/nameImg.svg" style="margin-top: 5px; margin-bottom: 0px; padding-bottom: 18.4px">
            <q-input v-model="display_name" 
            dense
            standout="bg-transparent text-white" 
            label-color="white" 
            color="white" 
            input-class="text-white" 
            class="round-sm full-width" label="Name"
            :rules="[val => !!val || 'This field is required']"
            /> 
          </q-item>

<!-- Status -->
          <q-item style="height: 70px;">
            <img class="profileImg" src="~assets/statusImg.svg">
            <q-input v-model="status" 
            dense
            standout="bg-transparent text-white" 
            label-color="white"  
            color="white" 
            input-class="text-white" 
            class="round-sm full-width" 
            label="Status"
            />
          </q-item>

<!-- Bio -->
          <q-item style="height: 70px;">
            <img class="profileImg" src="~assets/bioImg.svg">
            <q-input v-model="bio" 
            dense
            standout="bg-transparent text-white" 
            label-color="white"  
            color="white" 
            input-class="text-white" 
            class="round-sm full-width" 
            label="Bio"
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
  top: 1rem;
  right: 3rem;
  top:4% ;
  z-index: 1;
}

.profile{
  display: flex;
  font-weight:normal;
  font-size:large;
  top: 2rem ;
  z-indremex: 1;
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
  width: auto;
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
  top:0rem;
  position: absolute;
  /* border: 1px solid white; */
  z-index: 10;
  float: left;
  
}

/* .overlay {
  position: absolute; 
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #020039; 
  z-index: 0;
} */

.main-background {
  background: #020039;
}

.main-background-overlay {
   background:  url("~assets/MainBG.svg");
   background-repeat: no-repeat;
   background-size: cover;
}

.closebBtn{
  border-radius: 2px solid white;
  margin-left: 2rem;
  margin-top: 4rem;
  z-index: 99;
}

</style>