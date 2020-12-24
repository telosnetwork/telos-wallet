<template>
  <div class="q-pa-md">
    <div>
      Balance here
    </div>
    <q-layout
      view="hHh Lpr fFf"
      container
      style="height: 400px"
      class="shadow-2 rounded-borders"
    >
      <q-page-container>
        <q-page class="q-pa-md">
          Balance here
        </q-page>
      </q-page-container>
    </q-layout>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import moment from "moment";

const historyColumns = [
  {
    name: "block",
    required: true,
    label: "Block",
    align: "left",
    field: row => row.block_num,
    sortable: true
  },
  {
    name: "timestamp",
    required: true,
    label: "Timestamp",
    align: "left",
    field: row =>
      moment.utc(row.timestamp).format("dddd, MMMM Do YYYY, h:mm:ss a"),
    sortable: true
  },
  {
    name: "contract",
    required: true,
    label: "Contract",
    align: "left",
    field: row => row.act.account,
    sortable: true
  },
  {
    name: "action",
    required: true,
    label: "Action",
    align: "left",
    field: row => row.act.name,
    sortable: true
  },
  {
    name: "data",
    required: true,
    label: "Data",
    align: "left",
    field: row => row.act.data,
    format: val => {
      let lines = [];
      for (let key in val) {
        lines.push(`<b>${key}</b>: ${val[key]}`);
      }
      return lines.join("\n");
    },
    sortable: false
  }
];

export default {
  data() {
    return {
      avatar: null,
      bio: null,
      displayName: null,
      status: null,
      accountName: null,
      profileAccountName: null,
      accountHasProfile: false,
      accountHistory: [{}],
      accountHistoryColumns: historyColumns
    };
  },
  computed: {
    ...mapGetters("account", ["isAuthenticated"]),
    userAvatar() {
      if (this.avatar) return this.avatar;

      return "https://images.squarespace-cdn.com/content/54b7b93ce4b0a3e130d5d232/1519987165674-QZAGZHQWHWV8OXFW6KRT/icon.png?content-type=image%2Fpng";
    }
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
      this.loadAccountHistory();
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
    },
    async loadAccountHistory() {
      const actionHistory = await this.$hyperion.get(
        `/v2/history/get_actions?limit=20&account=${this.accountName}`
      );
      this.accountHistory = actionHistory.data.actions || [];
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
