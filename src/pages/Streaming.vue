<template>
  <q-page class="column justify-center items-center">
    <div class="text-h4">
      {{$t('streaming.title')}}
    </div>
    <div style="text-align: center">
      {{$t('streaming.intro1')}}<br/>{{$t('streaming.intro2')}}
    </div>
    <q-markup-table flat bordered>
      <thead class="background: primary">
        <tr>
          <th class="text-left">{{$t('streaming.block')}}</th>
          <th class="text-right">{{$t('streaming.timestamp')}}</th>
          <th class="text-right">{{$t('streaming.producer')}}</th>
          <th class="text-right">{{$t('streaming.billed_cpu')}}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="benchmark in benchmarks" :key="benchmark.global_sequence">
          <td class="text-left">{{ benchmark.block_num }}</td>
          <td class="text-right">
            {{
              moment
                .utc(benchmark["@timestamp"])
                .local()
                .format($t('streaming.local_format'))
            }}
          </td>
          <td class="text-right">{{ benchmark.producer }}</td>
          <td class="text-right">
            {{
              benchmark.cpu_usage_us > 1000
                ? benchmark.cpu_usage_us / 1000 + " ms"
                : benchmark.cpu_usage_us + " us"
            }}
          </td>
        </tr>
      </tbody>
    </q-markup-table>
  </q-page>
</template>

<script>
const moment = require("moment");
const HyperionSocketClient = require("@eosrio/hyperion-stream-client").default;
const fetch = require("node-fetch");

export default {
  data() {
    return {
      benchmarks: [],
      client: null,
      moment
    };
  },
  mounted: function() {
    if (this.client) return;

    this.client = new HyperionSocketClient(process.env.HYPERION_ENDPOINT, {
      async: true,
      fetch: fetch
    });

    this.client.onConnect = () => {
      this.client.streamActions({
        contract: "eosmechanics",
        action: "cpu",
        account: "eosmechanics",
        start_from: moment
          .utc()
          .subtract(2, "minutes")
          .format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
        read_until: 0,
        filters: []
      });
    };

    this.client.onData = async (data, ack) => {
      this.benchmarks.unshift(data.content);
      console.log(data);
      ack();
    };

    this.client.connect(() => {
      console.log("Connected to Hyperion Stream!");
    });
  },
  unmounted() {
    if (this.client) this.client.disconnect();

    this.client = null;
  }
};
</script>
