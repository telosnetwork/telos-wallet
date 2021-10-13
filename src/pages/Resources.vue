<template>
  <q-page>
    <q-card>
      Hi
    </q-card>
    <buysellram></buysellram>
    <staking></staking>
  </q-page>
</template>

<script>
import buysellram from './components/resources/buysellram.vue'
import Staking from './components/resources/staking.vue'

export default {
  components: { buysellram, Staking },
  // name: 'PageName',
}
</script>
