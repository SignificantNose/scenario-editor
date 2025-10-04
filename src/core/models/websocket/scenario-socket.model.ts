export interface Emitter {
  id: number;
  x: number;
  y: number;
  z: number;
  audioFileUri: string | null;
}

export interface Listener {
  id: number;
  x: number;
  y: number;
  z: number;
}

export interface ScenarioState {
  id: number;
  name: string;
  emitters: Emitter[];
  listeners: Listener[];
}

export interface WsScenarioMessage {
  action: string;
  payload: any;
}
