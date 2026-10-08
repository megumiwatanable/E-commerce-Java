import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../services/notification.service';
import { Notification } from '../../../models/order.model';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-page">
      <div class="header">
        <h1>Notifications</h1>
        <button (click)="markAllRead()" class="mark-all">Mark all as read</button>
      </div>
      <div *ngIf="notifications.length === 0" class="empty"><p>No notifications yet</p></div>
      <div *ngFor="let n of notifications" class="notification-card" [class.unread]="!n.readStatus"
           (click)="markRead(n)">
        <div class="icon">{{getIcon(n.type)}}</div>
        <div class="content">
          <h3>{{n.title}}</h3>
          <p>{{n.message}}</p>
          <span class="time">{{n.createdAt | date:'medium'}}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notifications-page { max-width: 700px; margin: 0 auto; padding: 32px 24px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    h1 { color: #1a1a2e; }
    .mark-all { background: none; border: none; color: #e94560; font-weight: 600; cursor: pointer; }
    .notification-card { display: flex; gap: 16px; padding: 16px; background: white; border-radius: 10px; margin-bottom: 8px; cursor: pointer; transition: background 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
    .notification-card.unread { border-left: 4px solid #e94560; background: #fff5f7; }
    .icon { font-size: 1.5rem; }
    .content h3 { margin: 0 0 4px; font-size: 0.95rem; }
    .content p { margin: 0 0 6px; color: #666; font-size: 0.85rem; }
    .time { color: #999; font-size: 0.75rem; }
    .empty { text-align: center; padding: 48px; color: #666; }
  `]
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  constructor(private notificationService: NotificationService) {}
  ngOnInit(): void { this.loadNotifications(); }
  loadNotifications(): void {
    this.notificationService.getNotifications().subscribe(res => {
      if (res.success && res.data) this.notifications = res.data.content;
    });
  }
  markRead(n: Notification): void {
    if (!n.readStatus) { this.notificationService.markAsRead(n.id).subscribe(() => n.readStatus = true); }
  }
  markAllRead(): void { this.notificationService.markAllAsRead().subscribe(() => this.loadNotifications()); }
  getIcon(type: string): string {
    const icons: Record<string, string> = {
      'ORDER_CREATED': '📦', 'ORDER_CONFIRMED': '✅', 'ORDER_SHIPPED': '🚚',
      'ORDER_DELIVERED': '🎉', 'ORDER_CANCELLED': '❌', 'PAYMENT_SUCCESS': '💳',
      'PAYMENT_FAILED': '⚠️', 'ORDER_OUT_FOR_DELIVERY': '🏍️'
    };
    return icons[type] || '🔔';
  }
}
