/* eslint-disable @typescript-eslint/no-explicit-any */
import { UAL } from "universal-authenticator-library";
import { Emitter, EventType } from 'mitt';

declare module '@vue/runtime-core' {

  interface ComponentCustomProperties {
    $store: any
    $emitter: Emitter<Record<EventType, unknown>>
    $ual: UAL
    $successNotification: any
    $errorNotification: any
  }
}
