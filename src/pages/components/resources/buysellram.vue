<template>
  <div class="q-pa-md"> 
    
    <!-- Buy or sell option -->
    <q-btn-toggle
      v-model="buyorsell"
      toggle-color="primary"
      rounded
      no-caps
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
          :hint="`~ ${Number(estimatedBytes).toLocaleString()} Bytes`"
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

      <q-btn label="Buy RAM" no-caps @click="tryBuyRAM()" />
    </q-card>

    <!-- Sell card -->
    <q-card v-if="buyorsell === 'sell'">
      <div>Amount of RAM to Sell</div>
      <q-input v-model="input" outlined />
      <q-btn
        color="primary"
        outline
        label="25%"
        @click="input = (ramAvail * 0.25).toFixed(0)"
      />
      <q-btn
        color="primary"
        outline
        label="50%"
        @click="input = (ramAvail * 0.5).toFixed(0)"
      />
      <q-btn
        color="primary"
        outline
        label="75%"
        @click="input = (ramAvail * 0.75).toFixed(0)"
      />
      <q-btn
        color="primary"
        outline
        label="100%"
        @click="input = (ramAvail * 1).toFixed(0)"
      />

      <div>
        Selling {{ input }} Bytes for {{ (input * ramPrice).toFixed(4) }} TLOS
      </div>

      <q-btn label="Sell RAM" no-caps @click="trySellRAM()" />
    </q-card>

    <q-dialog v-model="ramLow">
      <q-card style="max-width: 400px">
        <q-card-section class="row items-center">
          <div class="col text-h6">Your RAM is low</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <p>We recommend you buy {{ ramThres }} Bytes additional RAM.</p>
        </q-card-section>

        <div align="center">Proceed?</div>
        <q-card-actions class="q-pt-none" align="center">
          <q-btn
            outline
            no-caps
            class="hover-accent"
            label="Deny"
            color="primary"
            v-close-popup
          />
          <q-btn
            outline
            no-caps
            label="Approve"
            color="primary"
            class="hover-accent"
            @click="
              inputType = 'bytes';
              input = ramThres;
              tryBuyRAM();
            "
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";

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
      resourcePoll: false,
      nativeTokenBalance: 0
    };
  },

  computed: {
    ...mapGetters("account", ["isAuthenticated", "accountName"]),
    estimatedBytes() {
      if (this.inputType === "asset" && this.input) {
        return ((this.input / this.ramPrice) * 0.995).toFixed(0);
      } else if (this.inputType === "bytes" && this.input) {
        return parseFloat(this.input).toFixed(0);
      } else {
        return 0;
      }
    },
    bytesToSell() {
      if (this.buyorsell === "sell") {
        return this.input * this.fractionToSell;
      } else {
        return 0;
      }
    },
    canPayForRAM() {
      return this.nativeTokenBalance > this.ramPrice * this.ramThres;
    }
  },

  methods: {
    ...mapActions("resources", ["getBalanceFromChain"]),
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

      let transaction = false;
      try {
        transaction = await this.$store.$api.signTransaction(actions);
        this.$q.notify({
          type: "positive",
          message: `RAM bought`
        });
        this.$root.$emit("bought_ram");
      } catch (error) {
        this.$errorNotification(error);
      }
      if (transaction) this.ramLow = false;
    },

    async trySellRAM() {
      let actions = [];
      actions.push({
        account: "eosio",
        name: "sellram",
        data: {
          account: this.accountName.toLowerCase(),
          bytes: this.input
        }
      });

      let transaction = false;
      try {
        transaction = await this.$store.$api.signTransaction(actions);
        this.$q.notify({
          type: "positive",
          message: `RAM Sold`
        });
        this.$root.$emit("sold_ram");
      } catch (error) {
        this.$q.notify({
          color: "red-5",
          textColor: "white",
          icon: "warning",
          message: `${error}`
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
    },

    async getNativeTokenBalance() {
      if (this.isAuthenticated) {
        let payload = {
          address: "eosio.token",
          sym: "TLOS",
          accountName: this.accountName
        };
        this.nativeTokenBalance = parseFloat(
          (await this.getBalanceFromChain(payload)).split(" ")[0]
        );
      }
    }
  },

  async mounted() {
    await this.getNativeTokenBalance();
    await this.checkResources();

    this.resourcePoll = setInterval(async () => {
      await this.getNativeTokenBalance();
      await this.checkResources();
    }, 10000);
  },

  beforeDestroy() {
    clearInterval(this.resourcePoll);
  }
};
</script>
