<template>
  <div class="q-pa-md">
    <!-- Buy or sell option -->
    <q-btn-toggle
      v-model="buyorsell"
      toggle-color="primary"
      :options="[
        { label: 'Buy RAM', value: 'buy' },
        { label: 'Sell RAM', value: 'sell' }
      ]"
    />

    <!-- Buy card -->
    <q-card v-if="buyorsell === 'buy'">
      <div>Buy in TLOS or Bytes?</div>
      <q-radio v-model="inputType" val="asset" label="TLOS" />
      <q-radio v-model="inputType" val="bytes" label="Bytes" />

      <div v-if="inputType === 'asset'">
        <div>Amount of RAM to buy in TLOS</div>
        <q-input
          v-model="input"
          label="Amount of RAM to buy in TLOS"
          :hint="`~ ${estimatedBytes.toFixed(0)} Bytes`"
          outlined
        />
      </div>

      <div v-if="inputType === 'bytes'">
        <div>Amount of RAM to buy in Bytes</div>
        <q-input
          v-model="input"
          label="Amount of RAM to buy in Bytes"
          outlined
        />
      </div>

      <q-btn label="Buy RAM" @click="tryBuyRAM()" />
    </q-card>

    <!-- Sell card -->
    <q-card v-if="buyorsell === 'sell'"> </q-card>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  // name: 'ComponentName',
  data() {
    return {
      buyorsell: "buy",
      inputType: "asset", // or bytes
      input: "",
      fractionToSell: 0,
      ramPrice: 0,
      ramAvail: 0,
      ramLow: false,
      ramThres: 1000,
      polling: false,
    };
  },

  computed: {
    ...mapGetters('account', ['isAuthenticated', 'accountName']),
    estimatedBytes() {
      if (this.inputType === "asset" && this.input) {
        return this.input / this.ramPrice * 0.995; 
      } else if (this.inputType === "bytes" && this.input) {
        return this.input;
      } else {
        return 0;
      }
    }
  },

  methods: {
    async tryBuyRAM() {
      let actions = [];
      actions.push({
        account: "eosio",
        name: "buyrambytes",
        data: {
          payer: this.accountName.toLowerCase(),
          receiver: this.accountName.toLowerCase(),
          bytes: this.estimatedBytes
        }
      });

      const transaction = await this.$store.$api.signTransaction(actions);
      if (transaction) {
        this.$q.notify({
          type: "primary",
          message: `RAM bought`
        });
        this.$root.$emit("bought_ram");
      } else {
        this.$q.notify({
          type: "negative",
          message: `Failed to buy RAM`
        });
      }
    },

    async checkResources() {
      await this.getRamPrice();
      let account = await this.$store.$api.getAccount(this.accountName);
      this.ramAvail = account.ram_quota - account.ram_usage;
      if (this.ramAvail < this.ramThres) this.ramLow = true;
    },


    async getRamPrice() {
      const res = await this.$store.$api.getTableRows({
        code: "eosio",
        scope: "eosio",
        table: "rammarket",
        limit: 1,
        show_payer: false
      });
      let ramInfo = res.rows[0];
      this.ramPrice =
        ramInfo.quote.balance.split(" ")[0] /
        ramInfo.base.balance.split(" ")[0];
      console.log("ram price:")
      console.log(this.ramPrice);
    },
  },

  async mounted() {
    await this.checkResources();

    this.polling = setInterval(async () => {
      await this.checkResources();
    }, 30000);
  },

  beforeDestroy() {
    clearInterval(this.polling);
  },
};
</script>
