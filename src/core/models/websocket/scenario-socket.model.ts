import { EmitterData, ListenerData } from "@models/scenario/list-scenario-data.model";

export interface ScenarioState {
  id: number;
  name: string;
  emitters: EmitterData[];
  listeners: ListenerData[];
}

export interface WsScenarioMessage {
  action: string;
  payload: any;
}
