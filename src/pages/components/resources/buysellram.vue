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
          :hint="`~ ${estimatedBytes} Bytes`"
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
    };
  },

  computed: {
    ...mapGetters('account', ['isAuthenticated', 'accountName']),
    estimatedBytes() {
      if (this.inputType === "asset" && this.input) {
        return this.input * 4; // TODO bancor algo here
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
    }
  }
};
</script>
