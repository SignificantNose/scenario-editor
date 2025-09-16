import { EmitterEntity } from './emitter.model';
import { ListenerEntity } from './listener.model';

export interface ScenarioModel {
  id?: string;
  name: string;
  createdAt?: string;
  emitters: EmitterEntity[];
  listeners: ListenerEntity[];
}
