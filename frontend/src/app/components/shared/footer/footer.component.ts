import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="footer">
      <div class="footer-container">
        <div class="footer-section">
          <h3>🛒 ShopHub</h3>
          <p>Your one-stop e-commerce destination for quality products at great prices.</p>
        </div>
        <div class="footer-section">
          <h4>Quick Links</h4>
          <a routerLink="/products">All Products</a>
          <a routerLink="/products">Categories</a>
          <a routerLink="/products">Deals</a>
        </div>
        <div class="footer-section">
          <h4>Customer Service</h4>
          <a href="#">Contact Us</a>
          <a href="#">FAQs</a>
          <a href="#">Shipping Info</a>
          <a href="#">Returns</a>
        </div>
        <div class="footer-section">
          <h4>Contact</h4>
          <p>📧 support&#64;shophub.com</p>
          <p>📞 1-800-SHOP-HUB</p>
          <p>📍 123 Commerce St, Tech City</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 ShopHub. All rights reserved. Built with Spring Boot, Angular & Kafka</p>
      </div>
    </footer>
  `,
  styles: [`
    .footer { background: #1a1a2e; color: rgba(255,255,255,0.8); padding: 48px 24px 24px; }
    .footer-container { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 32px; }
    .footer-section h3, .footer-section h4 { color: white; margin-bottom: 16px; }
    .footer-section p { margin: 8px 0; line-height: 1.6; }
    .footer-section a { display: block; color: rgba(255,255,255,0.7); text-decoration: none; margin: 8px 0; transition: color 0.2s; }
    .footer-section a:hover { color: #e94560; }
    .footer-bottom { text-align: center; padding-top: 24px; margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); }
  `]
})
export class FooterComponent {}
