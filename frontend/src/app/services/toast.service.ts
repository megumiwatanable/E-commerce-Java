import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage { id: number; type: 'success'|'error'|'info'; title: string; message: string; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  private messagesSubject = new BehaviorSubject<ToastMessage[]>([]);
  messages$ = this.messagesSubject.asObservable();

  success(message: string, title = 'Success'): void { this.show('success', title, message); }
  error(message: string, title = 'Something went wrong'): void { this.show('error', title, message); }
  info(message: string, title = 'Notice'): void { this.show('info', title, message); }
  dismiss(id: number): void { this.messagesSubject.next(this.messagesSubject.value.filter(item => item.id !== id)); }

  private show(type: ToastMessage['type'], title: string, message: string): void {
    const toast = { id: Date.now() + Math.random(), type, title, message };
    this.messagesSubject.next([...this.messagesSubject.value, toast]);
    window.setTimeout(() => this.dismiss(toast.id), 3500);
  }
}
