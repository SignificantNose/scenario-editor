import { EmitterData, ListenerData } from "./list-scenario-data.model";

export interface UpdateScenarioData {
  id: number;
  name: string;
  emitters: EmitterData[];
  listeners: ListenerData[];
}
