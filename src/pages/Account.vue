<template>
  <q-page class="column justify-center items-center">
    <q-input
      outlined
      bottom-slots
      v-model="accountName"
      label="Account name"
      counter
      maxlength="12"
    >
      <template v-slot:append>
        <q-icon name="search" @click="search" />
      </template>
    </q-input>
    <q-page-container  v-if="accountHasProfile">
    <q-avatar class="q-py-md" size="150px">
      <img
        :src="
          avatar
            ? avatar
            : 'https://images.squarespace-cdn.com/content/54b7b93ce4b0a3e130d5d232/1519987165674-QZAGZHQWHWV8OXFW6KRT/icon.png?content-type=image%2Fpng'
        "
      />
    </q-avatar>
    <div class="q-py-md">
      <q-field filled label="Account name" stack-label>
        <template v-slot:control>
          <div class="self-center full-width no-outline" tabindex="0">
            {{ profileAccountName }}
          </div>
        </template>
      </q-field>
      <q-field filled label="Display name" stack-label>
        <template v-slot:control>
          <div class="self-center full-width no-outline" tabindex="0">
            {{ displayName }}
          </div>
        </template>
      </q-field>
      <q-field filled label="Status" stack-label>
        <template v-slot:control>
          <div class="self-center full-width no-outline" tabindex="0">
            {{ status }}
          </div>
        </template>
      </q-field>
      <q-field filled label="Bio" stack-label>
        <template v-slot:control>
          <div
            class="self-center full-width no-outline"
            tabindex="0"
            v-html="bio"
          ></div>
        </template>
      </q-field>
    </div>
    </q-page-container>
    <q-page-container v-else>
        <div>
        <h4>Account profile not found</h4>
    </div>
    </q-page-container>
  </q-page>
</template>

<script>
import { mapGetters, mapActions } from "vuex";

export default {
  data() {
    return {
      avatar: null,
      bio: null,
      displayName: null,
      status: null,
      accountName: null,
      profileAccountName: null,
      accountHasProfile: false
    };
  },
  computed: {
    ...mapGetters("account", ["isAuthenticated"])
  },
  watch: {
    "$route.params.accountName": function(accountName) {
      if (accountName != this.profileAccountName) {
        this.accountName = accountName;
        this.loadUserProfile();
      }
    }
  },
  methods: {
    ...mapActions("account", ["getUserProfile"]),
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
      this.profileAccountName = this.accountName;
      this.avatar = accountProfile.avatar;
      this.bio = accountProfile.bio;
      this.status = accountProfile.status;
      this.displayName = accountProfile.display_name;
    },
    search() {
      this.loadUserProfile();
    }
  },
  created: async function() {
    const accountName = this.$route.params.accountName;
    if (!accountName) {
      return;
    }

    this.accountName = accountName;

    this.loadUserProfile();
  }
};
</script>
