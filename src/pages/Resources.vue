<template>
  <q-page>
    <div class="q-gutter-y-md" style="max-width: 600px">
      <q-card>
        <q-tabs
          v-model="tab"
          no-caps
        >
          <q-tab name="ram" label="Buy/Sell RAM" />
          <q-tab name="netcpu" label="Stake CPU/NET" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="tab" animated>
          <q-tab-panel name="ram">
            <buysellram></buysellram>
          </q-tab-panel>

          <q-tab-panel name="netcpu">
            <staking></staking>
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import buysellram from "./components/resources/buysellram.vue";
import Staking from "./components/resources/staking.vue";

export default {
  components: { buysellram, Staking },
  // name: 'PageName',
  data() {
    return {
      tab: "ram"
    };
  }
};
</script>
