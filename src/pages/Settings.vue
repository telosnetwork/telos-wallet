<template>
  <div
    class="profile flex-center main-background-overlay"
    :style="` display:flex; overflow: auto; height: 100vh !important;`"
  >
    <div>
      <div class="profile text-white flex-center">
        <label style="height: 10px; margin-bottom: 100px">Profile</label>
      </div>
      <q-list round flat dense class="text-white" icon="west">
        <!-- User Avatar -->
        <div class="flex-center relative" style="display:flex;">
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

          <q-item class="justify-center userAvatar">
            <q-avatar size="150px" color="transparent" text-color="white">
              <img :src="userAvatar" />
            </q-avatar>
          </q-item>

          <!-- </q-container> -->
          <q-item class="justify-center uploadImage">
            <q-btn
              :style="
                `height: 2.5rem; width: 2.5rem; border-radius: 10rem; border: 0.010rem solid white;`
              "
              @click="onPickFile"
            >
              <q-icon name="add_a_photo" color="white" />
            </q-btn>
            <input
              type="file"
              ref="fileInput"
              accept="image/*"
              style="display: none"
              @change="onFilePicked"
            />
          </q-item>
        </div>

        <!-- Upload Image Button -->

        <div class="profileInformation">
          <!-- Avatar Name -->
          <q-item style="height: 70px;">
            <img
              class="profileImg"
              src="~assets/avatarImg.svg"
              style="margin-top: 5px; margin-bottom: 0px; padding-bottom: 18.4px"
            />
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
          <q-item style="height: 70px; margin-top: 18.4px">
            <img
              class="profileImg"
              src="~assets/nameImg.svg"
              style="margin-top: 5px; margin-bottom: 0px; padding-bottom: 18.4px"
            />
            <q-input
              v-model="display_name"
              dense
              standout="bg-transparent text-white"
              label-color="white"
              color="white"
              input-class="text-white"
              class="round-sm full-width"
              label="Name"
              :rules="[val => !!val || 'This field is required']"
            />
          </q-item>

          <!-- Status -->
          <q-item style="height: 70px;">
            <img
              class="profileImg"
              src="~assets/statusImg.svg"
              style="margin-top: 5px; margin-bottom: 0px; padding-bottom: 18.4px"
            />
            <q-input
              v-model="status"
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
            <img
              class="profileImg"
              src="~assets/bioImg.svg"
              style="margin-top: 5px; margin-bottom: 0px; padding-bottom: 18.4px"
            />
            <q-input
              v-model="bio"
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

        <!-- Save Button -->
        <q-item class="text-white row justify-center saveBtn">
          <q-btn
            text-color="white"
            :style="
              `height: 50px; width: 200px; background: #2e1f4f;  border-radius: 10rem; text-decoration-color: white;`
            "
            label="SAVE"
            @click="save"
            :disable="display_name.length === 0"
          />
          <!-- Back Button -->
        </q-item>
        <!-- Google label -->
        <!-- <div
          class="flex-center"
          style="position: relative; display:flex; left: 1rem; top: 1rem; bottom: 0rem"
        >
          <p class="googleAccount text-white">
            Google account is connected | <b> Private Key</b>
          </p>
          <img src="~assets/googleBlock.svg" />
        </div> -->

        <!-- <q-item class="column">
          <label class="q-mr-auto information" >Bio</label>
          <q-input v-model="bio" />
        </q-item> -->
      </q-list>
      <!-- <div class="column q-mx-md" :style="`max-width: 800px; margin: auto; overflow: auto; height: ${availableHeight}px !important;`">
    <login-button v-if="isAuthenticated" style="display: none"/>
    <q-list class="q-py-md">
      <q-item class="justify-center">
        <q-avatar size="110px" font-size="52px" color="white" text-color="white">
          <img :src="userAvatar" style="border: 1px solid purple"/>
        </q-avatar>
      </q-item>
      <q-item class="justify-center">
        <q-btn text-color="white" :style="`height: 35px; background: ${themeColor}`" label="UPLOAD IMAGE"  @click="onPickFile" />
        <input type="file" ref="fileInput" accept="image/*" style="display: none" @change="onFilePicked"/>
      </q-item>
      <q-item>
        <q-input v-model="avatar" dense borderless filled disable class="round-sm full-width" maxlength="128" counter label="Avatar URL" />
      </q-item>
      <q-item>
        <q-input v-model="display_name" dense borderless filled
          class="round-sm full-width" maxlength="16" counter label="Name"
          :rules="[val => !!val || 'This field is required']"/> 
      </q-item>
      <q-item>
        <q-input v-model="status" dense borderless filled class="round-sm full-width" maxlength="16" counter label="Status" />
      </q-item>
      <q-item class="column">
        <label class="q-mr-auto">Bio</label>
        <q-editor v-model="bio" min-height="5rem" />
      </q-item>
      <q-item>
        <q-btn text-color="white" :style="`height: 35px; background: ${themeColor}`" label="SAVE" @click="save" :disable="display_name.length === 0" />
      </q-item>
      <q-item>
        <label v-if="privateKey && connected" class="flex items-center text-weight-medium q-ml-sm" :style="`color: ${themeColor}`">Google Account is Connected:</label>
        <label v-else class="flex items-center text-weight-medium" :style="'color: grey'">Connect Google Account:</label>
        <q-btn v-if="!privateKey" class="q-ml-sm" text-color="white" :style="`height: 35px; background: ${themeColor}`"
          no-caps label="Authenticate" @click="onGoogleSignIn(null)"/>
        <div class="q-ml-sm" id="google-authentication-button" :style="`display: ${(privateKey && !connected) ? 'unset' : 'none'}`"></div>
        <q-btn v-if="privateKey && connected" class="q-ml-sm" text-color="white" :style="`height: 35px; background: ${themeColor}`"
          no-caps label="View Private Key" @click="confirm = true"/>
      </q-item>
    </q-list>

    <q-dialog v-model="confirm" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <span class="q-mx-auto text-h5">Warning!</span>
          <span class="q-mx-auto text-center">
            Are you sure you want to show your Telos private keys?
            Be sure you are in a private location and no one can see your screen.
            Anyone viewing your private keys can steal your funds.
          </span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="Yes, I'm sure" color="primary" @click="confirm = false; keyView = true;" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="keyView">
      <q-card>
        <q-card-section>
          <div class="text-h6">Private Key</div>
        </q-card-section>
        <q-card-section class="q-pt-none text-center" style="word-break: break-all;">
          {{privateKey}}
          <q-btn flat dense size="sm" icon="far fa-copy" @click="copyToClipboard(privateKey)"/>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <div v-if="saving"
      class="justify-center absolute flex full-width full-height"
      style="top: 0; left: 0; background: rgba(0, 0, 0, 0.4);"
    >
      <q-spinner-dots class="q-my-auto" color="primary" size="40px" />
    </div> -->
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import LoginButton from "components/LoginButton.vue";

export default {
  components: {},
  data() {
    return {
      accountHasProfile: false,
      image: null,
      avatar: "",
      display_name: "",
      status: "",
      bio: "",
      is_verified: 0,
      saving: false,
      account: null,
      privateKey: null,
      checkInterval: null,
      clearInterval: null,
      connected: false,
      confirm: false,
      keyView: false
    };
  },
  computed: {
    ...mapGetters("account", ["isAuthenticated", "accountName"]),
    ...mapGetters("global", ["footerHeight"]),
    availableHeight() {
      return (
        window.innerHeight - (this.isAuthenticated ? this.footerHeight : 0)
      );
    },
    userAvatar() {
      if (this.avatar) return this.avatar;

      return "/profile/default_avatar.svg";
    }
  },
  methods: {
    ...mapActions("account", ["accountExists", "getUserProfile"]),
    upload(file, p) {
      var fd = new FormData();
      fd.append("image", file); // Append the file

      var xhr = new XMLHttpRequest();
      xhr.open("POST", "https://api.imgur.com/3/image"); // Boooom!
      xhr.setRequestHeader("Authorization", "Client-ID b3386c312851443");
      xhr.onload = function() {
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
      if (
        !this.$store.state.account.profiles.hasOwnProperty(this.accountName)
      ) {
        await this.getUserProfile(this.accountName);
      }
      const accountProfile = this.$store.state.account.profiles[
        this.accountName
      ];
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
      const accountProfile = this.$store.state.account.profiles[
        this.accountName
      ];
      const actions = [];
      if (!accountProfile) {
        actions.push({
          account: "profiles",
          name: "newprofile",
          data: {
            account: this.accountName,
            display_name: this.display_name,
            avatar: this.avatar,
            bio: this.bio,
            status: this.status
          }
        });
      } else {
        if (accountProfile.avatar !== this.avatar) {
          actions.push({
            account: "profiles",
            name: "editavatar",
            data: {
              account: this.accountName,
              new_avatar: this.avatar
            }
          });
        }
        if (accountProfile.display_name !== this.display_name) {
          actions.push({
            account: "profiles",
            name: "editdisplay",
            data: {
              account: this.accountName,
              new_display_name: this.display_name
            }
          });
        }
        if (accountProfile.bio !== this.bio) {
          actions.push({
            account: "profiles",
            name: "editbio",
            data: {
              account: this.accountName,
              new_bio: this.bio
            }
          });
        }
        if (accountProfile.status !== this.status) {
          actions.push({
            account: "profiles",
            name: "editstatus",
            data: {
              account: this.accountName,
              new_status: this.status
            }
          });
        }
      }
      if (actions.length > 0) {
        this.saving = true;
        const transaction = await this.$store.$api.signTransaction(
          actions,
          `${!accountProfile ? "Created new profile" : "Updated profile"}`
        );
        if (transaction) {
          if (transaction === "needAuth") {
            this.$q.notify({
              type: "negative",
              message: `Authentication is required`
            });
          } else if (transaction === "error") {
            this.$q.notify({
              type: "negative",
              message: `Action failed. Make sure authentication is done correctly.`
            });
          } else if (transaction !== "cancelled") {
            this.$q.notify({
              type: "primary",
              message: `${
                !accountProfile
                  ? "New profile is created successfully"
                  : "Profile is updated successfully"
              }`
            });
          }
        }
      } else {
        this.$q.notify({
          type: "primary",
          message: `No change to save`
        });
      }
      this.saving = false;
    },
    async onGoogleSignIn(user) {
      if (!user && !this.privateKey) {
        this.$store.$account.needAuth = true;
      }
      while (!this.privateKey) {
        await new Promise(res => setTimeout(res, 10));
      }
      let driveData = null;
      const { result } = await this.loadFromGoogleDrive();
      if (result) {
        const accounts = Object.keys(result);
        if (accounts.length > 0) {
          driveData = result;
        }
      }
      if (
        driveData &&
        Object.keys(driveData).findIndex(
          acc => driveData[acc].privateKey === this.privateKey
        ) >= 0
      ) {
        this.connected = true;
      } else if (user) {
        this.saveToGoogleDrive();
      }
    },
    async loadFromGoogleDrive() {
      let result = null;
      let fileId = null;
      let callbacked = false;
      const network =
        this.$blockchain.config.name === "telos-testnet"
          ? "(testnet)"
          : "(mainnet)";
      await gapi.client.load("drive", "v2");
      var request = gapi.client.drive.files.list({
        q: `title = 'Telos Web Wallet${network}' and explicitlyTrashed = false`,
        space: "drive"
      });
      await request.execute(
        async function(resp) {
          if (resp && resp.items && resp.items.length > 0) {
            fileId = resp.items[0].id;
            var file = gapi.client.drive.files.get({
              fileId: resp.items[0].id,
              alt: "media"
            });
            file.then(
              function(response) {
                result = JSON.parse(response.body);
                callbacked = true;
              },
              function(error) {
                callbacked = true;
              }
            );
          } else {
            callbacked = true;
          }
        },
        function(error) {
          callbacked = true;
        }
      );
      let timeoutCnt = 100;
      while (!callbacked) {
        await new Promise(res => setTimeout(res, 100));
        timeoutCnt--;
        if (timeoutCnt === 0) {
          break;
        }
      }
      if (result) {
        delete result.account;
        delete result.privateKey;
        delete result.publicKey;
      }
      return { result, fileId };
    },
    async saveToGoogleDrive(account = null, keys = null) {
      if (!keys && !this.privateKey) {
        return;
      }
      let { result, fileId } = await this.loadFromGoogleDrive();
      result = result || {};
      result[account ? account : this.account] = {
        account: account ? account : this.account,
        privateKey: keys
          ? this.encrypt(keys.privateKey)
          : this.encrypt(this.privateKey),
        publicKey: keys ? keys.publicKey : null
      };
      var fileContent = JSON.stringify(result); // As a sample, upload a text file.
      var file = new Blob([fileContent], { type: "text/plain" });
      const network =
        this.$blockchain.config.name === "telos-testnet"
          ? "(testnet)"
          : "(mainnet)";
      var metadata = {
        name: `Telos Web Wallet${network}`, // Filename at Google Drive
        mimeType: "text/plain" // mimeType at Google Drive
      };

      var accessToken = gapi.auth2
        .getAuthInstance()
        .currentUser.get()
        .getAuthResponse(true).access_token; // Here gapi is used for retrieving the access token.
      var form = new FormData();
      form.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" })
      );
      form.append("file", file);

      const showError = function(p, val) {
        if (val.message) {
          p.$q.notify({
            type: "negative",
            message: val.message
          });
        } else {
          p.$q.notify({
            type: "primary",
            message: "Account is saved on your google drive"
          });
        }
      };
      await fetch(
        `https://www.googleapis.com/upload/drive/v3/files${
          fileId ? "/" + fileId : ""
        }?uploadType=multipart&fields=id`,
        {
          method: fileId ? "PATCH" : "POST",
          headers: new Headers({ Authorization: "Bearer " + accessToken }),
          body: form
        }
      )
        .then(res => {
          this.connected = true;
          return res.json();
        })
        .then(val => showError(this, val));
    },
    copyToClipboard(str) {
      var el = document.createElement("textarea");
      el.value = str;
      el.setAttribute("readonly", "");
      el.style = { display: "none" };
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);

      this.$q.notify({
        type: "primary",
        message: "Copied it to the clipboard successfully"
      });
    }
  },
  created: async function() {
    this.loadUserProfile();
  },
  async mounted() {
    gapi.signin2.render("google-authentication-button", {
      height: 35,
      scope: "profile email https://www.googleapis.com/auth/drive",
      onsuccess: this.onGoogleSignIn
    });
    this.checkInterval = setInterval(async () => {
      this.account = this.$store.$account.account;
      this.privateKey = this.$store.$account.privateKey;
    }, 50);
    if (!window.location.href.includes("localhost")) {
      this.clearInterval = setInterval(async () => {
        console.clear();
        console.log("Don't try to use Inspector!");
      }, 5000);
    }
  },
  async beforeDestroy() {
    if (this.checkInterval) clearInterval(this.checkInterval);
    if (this.clearInterval) clearInterval(this.clearInterval);
  }
};
</script>

<style scoped>
.container {
  display: flex;
  block-size: auto;
  align-self: center;
}

.saveBtn {
  border-radius: 6rem;
  margin-top: 1rem;
}

.profile {
  display: flex;
  font-weight: normal;
  font-size: large;
  top: 2rem;
  z-indremex: 1;
}
.uploadImage {
  /* background-image: url("~assets/camera.svg"); */
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
  position: absolute;
}

.avatarBackground {
  display: flex;
  position: relative;
  left: center;
  margin-bottom: 6rem;
  margin-left: 4rem;
  top: -2rem;
}

.profileInformation {
  margin-top: 100px;
  width: 35rem;
}

.settingImg {
  background-color: white;
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;
  border-bottom-left-radius: unset;
  border-bottom-left-radius: unset;
  margin-top: -2.5rem;
  margin-left: 1rem;
}

.profileImg {
  margin: 1rem 1.5rem 1rem;
  z-index: 5;
}

.nameImg {
  margin: 1rem 1.5rem 1rem;
}

.googleAccount {
  position: absolute;
  margin-top: 2rem;
  display: block;
  text-decoration-color: white;
  font-size: 0.95rem;
  margin-bottom: 2rem;
}

.googleBlock {
}

.backBtn {
  top: 0rem;
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
</style>
