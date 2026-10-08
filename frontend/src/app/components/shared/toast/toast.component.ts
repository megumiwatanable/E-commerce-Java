import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector:'app-toast', standalone:true, imports:[CommonModule],
  template:`<div class="toast-stack"><div *ngFor="let toast of service.messages$|async" class="toast" [class]="'toast '+toast.type"><span class="icon">{{toast.type==='success'?'✓':toast.type==='error'?'!':'i'}}</span><div><strong>{{toast.title}}</strong><p>{{toast.message}}</p></div><button (click)="service.dismiss(toast.id)">×</button></div></div>`,
  styles:[`.toast-stack{position:fixed;right:20px;top:82px;z-index:3000;display:grid;gap:10px;width:min(390px,calc(100vw - 28px))}.toast{display:grid;grid-template-columns:34px 1fr auto;gap:11px;align-items:start;background:#fff;border:1px solid #e1e6eb;border-left:4px solid #607080;border-radius:12px;padding:14px;box-shadow:0 14px 42px rgba(22,32,48,.16);animation:in .2s ease}.toast.success{border-left-color:#21805f}.toast.error{border-left-color:#c54c3f}.toast.info{border-left-color:#3977a8}.icon{width:30px;height:30px;display:grid;place-items:center;border-radius:50%;background:#eef3f1;color:#185c4a;font-weight:900}.error .icon{background:#fff0ed;color:#ad3f34}.toast strong{font-size:.88rem;color:#202a39}.toast p{font-size:.8rem;color:#6d7786;margin-top:2px;line-height:1.4}.toast button{border:0;background:none;color:#8b94a1;font-size:1.2rem;cursor:pointer}@keyframes in{from{opacity:0;transform:translateY(-8px)}}@media(max-width:600px){.toast-stack{right:14px;top:72px}}`]
})
export class ToastComponent { constructor(public service:ToastService){} }
