import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-page">
      <h1>My Profile</h1>
      <div class="profile-card" *ngIf="user">
        <div class="avatar">{{user.firstName[0]}}{{user.lastName[0]}}</div>
        <form (ngSubmit)="updateProfile()">
          <div class="form-row">
            <div class="form-group">
              <label>First Name</label>
              <input [(ngModel)]="user.firstName" name="firstName" />
            </div>
            <div class="form-group">
              <label>Last Name</label>
              <input [(ngModel)]="user.lastName" name="lastName" />
            </div>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input [value]="user.email" disabled />
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input [(ngModel)]="user.phone" name="phone" />
          </div>
          <div class="form-group">
            <label>Role</label>
            <input [value]="user.role" disabled />
          </div>
          <button type="submit" class="save-btn">Save Changes</button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .profile-page { max-width: 600px; margin: 0 auto; padding: 32px 24px; }
    h1 { color: #1a1a2e; margin-bottom: 24px; }
    .profile-card { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .avatar { width: 80px; height: 80px; background: #e94560; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; margin: 0 auto 24px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 6px; font-weight: 600; color: #333; }
    .form-group input { width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; }
    .form-group input:focus { outline: none; border-color: #e94560; }
    .save-btn { width: 100%; padding: 14px; background: #e94560; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }
  `]
})
export class ProfileComponent implements OnInit {
  user?: User;
  constructor(private authService: AuthService, private toast: ToastService) {}
  ngOnInit(): void {
    this.authService.getProfile().subscribe(res => {
      if (res.success && res.data) this.user = res.data;
    });
  }
  updateProfile(): void {
    if (this.user) {
      this.authService.updateProfile({ firstName: this.user.firstName, lastName: this.user.lastName, phone: this.user.phone })
        .subscribe({next: res => { if (res.success) this.toast.success('Your profile has been updated.'); }, error: () => this.toast.error('Could not update your profile.')});
    }
  }
}
