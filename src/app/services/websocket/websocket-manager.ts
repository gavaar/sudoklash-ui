import { BehaviorSubject, Observable } from 'rxjs';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';

export class WebSocketManager<T, K> {
  private _webSocket: WebSocketSubject<T | K>;
  private _webSocketSubject = new BehaviorSubject<T | null>(null);

  get socketUpdates$(): Observable<T | null> {
    return this._webSocketSubject.asObservable();
  }

  constructor(url: string) {
    this._webSocket = webSocket(url);
  }

  connect(): void {
    this._webSocket.asObservable().subscribe({
      next: v => this._webSocketSubject.next(v as T),
    });
  }

  next(value: K): void {
    this._webSocket.next(value);
  }

  destroy(): void {
    this._webSocket.complete();
    this._webSocketSubject.complete();
  }
}
