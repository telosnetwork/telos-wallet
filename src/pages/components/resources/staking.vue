<template>
  <div class="q-pa-md">
    <!-- Stake, Unstake, refund options -->
    <q-btn-toggle
      v-model="resourceOption"
      toggle-color="primary"
      rounded
      no-caps
      :options="[
        { label: 'Stake', value: 'stake' },
        { label: 'Unstake', value: 'unstake' },
        { label: 'Refund', value: 'refund' }
      ]"
    />

    <!-- Stake card -->
    <q-card v-if="resourceOption === 'stake'">
      <div>Amount of CPU to Stake in TLOS</div>
      <q-input outlined v-model="inputCPU" />

      <div>Amount of NET to Stake in TLOS</div>
      <q-input outlined v-model="inputNET" />

      <q-btn label="Stake" no-caps @click="tryStake()" />
    </q-card>

    <!-- Unstake card -->
    <q-card v-if="resourceOption === 'unstake'">
      <div>Amount of CPU to Unstake in TLOS</div>
      <q-input outlined v-model="inputCPU" />

      <div>Amount of NET to Unstake in TLOS</div>
      <q-input outlined v-model="inputNET" />

      <q-btn label="Unstake" no-caps @click="tryUnstake()" />
    </q-card>

    <!-- TODO Refund card -->


  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";

export default {
  // name: 'ComponentName',
  data() {
    return {
      resourceOption: "stake",
      inputCPU: 0,
      inputNET: 0,
      CPUavail: 0,
      NETavail: 0,
      polling: false
    };
  },

  computed: {
    ...mapGetters("account", ["isAuthenticated", "accountName"]),
    
  },

  methods: {
    async tryStake() {
      let actions = [];
      actions.push({
        account: "eosio",
        name: "delegatebw",
        data: {
          from: this.accountName.toLowerCase(),
          receiver: this.accountName.toLowerCase(),
          stake_cpu_quantity: String(parseFloat(this.inputCPU).toFixed(4)) + String(" TLOS"),
          stake_net_quantity: String(parseFloat(this.inputNET).toFixed(4)) + String(" TLOS"),
          transfer: false
        }
      });

      const transaction = await this.$store.$api.signTransaction(actions);
      if (transaction) {
        this.$q.notify({
          type: "positive",
          message: `Staked resources`
        });
        this.$root.$emit("staked");
      } else {
        this.$q.notify({
          type: "negative",
          message: `Failed to stake`
        });
      }
    },

    async tryUnstake() {
      let actions = [];
      actions.push({
        account: "eosio",
        name: "undelegatebw",
        data: {
          from: this.accountName.toLowerCase(),
          receiver: this.accountName.toLowerCase(),
          unstake_cpu_quantity: String(parseFloat(this.inputCPU).toFixed(4)) + String(" TLOS"),
          unstake_net_quantity: String(parseFloat(this.inputNET).toFixed(4)) + String(" TLOS"),
        }
      });

      const transaction = await this.$store.$api.signTransaction(actions);
      if (transaction) {
        this.$q.notify({
          type: "positive",
          message: `Unstaked resources`
        });
        this.$root.$emit("unstaked");
      } else {
        this.$q.notify({
          type: "negative",
          message: `Failed to unstake`
        });
      }
    },

    async checkResources() {
      let account = await this.$store.$api.getAccount(this.accountName);
      console.log(account);
      this.CPUavail = account.cpu_limit.available;
      this.NETavail = account.net_limit.available;    
    },

  },

  async mounted() {
    await this.checkResources();

    this.polling = setInterval(async () => {
      await this.checkResources();
    }, 10000);
  },

  beforeDestroy() {
    clearInterval(this.polling);
  }
};
</script>
