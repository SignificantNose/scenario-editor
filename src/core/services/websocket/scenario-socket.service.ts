import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { AppConfigService } from '../config/app-config.service';
import { ScenarioState, WsScenarioMessage } from '@models/websocket/scenario-socket.model';

@Injectable({ providedIn: 'root' })
export class ScenarioSocketService {
  private socket: Socket | null = null;

  constructor(private appConfigService: AppConfigService) {}

  private connect(): void {
    if (!this.socket) {
      this.socket = io(this.appConfigService.config?.wsUrl ?? '', {
        autoConnect: false,
      });
      this.socket.connect();
    }
  }

  joinScenario(scenarioId: number): Observable<ScenarioState> {
    this.connect();
    return new Observable((observer) => {
      if (!this.socket) return;

      this.socket.emit('joinScenario', scenarioId);

      const listener = (state: ScenarioState) => {
        observer.next(state);
      };
      this.socket.on('scenario:state', listener);

      return () => {
        if (this.socket) {
          this.socket.off('scenario:state', listener);
          this.socket.emit('leaveScenario', scenarioId);
        }
      };
    });
  }

  sendUpdate(scenarioId: number, action: string, payload: any) {
    this.connect();
    this.socket?.emit('scenario:update', { scenarioId, action, payload });
  }

  onUpdate(): Observable<WsScenarioMessage> {
    this.connect();
    return new Observable((observer) => {
      const listener = (msg: WsScenarioMessage) => observer.next(msg);
      this.socket?.on('scenario:update', listener);

      return () => {
        this.socket?.off('scenario:update', listener);
      };
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

