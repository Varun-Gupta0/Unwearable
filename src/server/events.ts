import { EventEmitter } from 'events';

const eventEmitter = new EventEmitter();

export function emitEvent(eventName: string, payload: any) {
  eventEmitter.emit(eventName, payload);
}

export function onEvent(eventName: string, listener: (...args: any[]) => void) {
  eventEmitter.on(eventName, listener);
}
