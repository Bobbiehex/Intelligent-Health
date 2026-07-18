import { EventEmitter } from 'events';

export const adminEvents = new EventEmitter();

// Global helper to trigger real-time updates for administrators
export function emitAdminEvent(type: string, data?: any) {
  adminEvents.emit('admin_event', {
    type,
    data,
    timestamp: new Date().toISOString()
  });
}
