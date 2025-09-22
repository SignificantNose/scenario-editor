import { EmitterData, ListenerData } from "./list-scenario-data.model";

export interface CreateScenarioData {
  name: string;
  emitters: EmitterData[];
  listeners: ListenerData[];
}
