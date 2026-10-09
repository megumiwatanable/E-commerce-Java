import { Routes } from '@angular/router';
import { authGuard, adminGuard, customerGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./components/customer/home/home.component').then(m => m.HomeComponent) },
  { path: 'login', loadComponent: () => import('./components/customer/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./components/customer/register/register.component').then(m => m.RegisterComponent) },
  { path: 'products', loadComponent: () => import('./components/customer/product-list/product-list.component').then(m => m.ProductListComponent) },
  { path: 'products/:id', loadComponent: () => import('./components/customer/product-detail/product-detail.component').then(m => m.ProductDetailComponent) },
  { path: 'cart', loadComponent: () => import('./components/customer/cart/cart.component').then(m => m.CartComponent) },
  { path: 'checkout', loadComponent: () => import('./components/customer/checkout/checkout.component').then(m => m.CheckoutComponent) },
  { path: 'order-success/:orderNumber', loadComponent: () => import('./components/customer/order-success/order-success.component').then(m => m.OrderSuccessComponent), canActivate: [authGuard] },
  { path: 'my-orders', loadComponent: () => import('./components/customer/my-orders/my-orders.component').then(m => m.MyOrdersComponent), canActivate: [authGuard, customerGuard] },
  { path: 'order/:id', loadComponent: () => import('./components/customer/order-detail/order-detail.component').then(m => m.OrderDetailComponent), canActivate: [authGuard] },
  { path: 'profile', loadComponent: () => import('./components/customer/profile/profile.component').then(m => m.ProfileComponent), canActivate: [authGuard] },
  { path: 'notifications', loadComponent: () => import('./components/customer/notifications/notifications.component').then(m => m.NotificationsComponent), canActivate: [authGuard] },

  // Admin routes
  { path: 'admin/login', loadComponent: () => import('./components/admin/admin-login/admin-login.component').then(m => m.AdminLoginComponent) },
  { path: 'admin', loadComponent: () => import('./components/admin/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent), canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./components/admin/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'products', loadComponent: () => import('./components/admin/admin-products/admin-products.component').then(m => m.AdminProductsComponent) },
      { path: 'categories', loadComponent: () => import('./components/admin/admin-categories/admin-categories.component').then(m => m.AdminCategoriesComponent) },
      { path: 'inventory', loadComponent: () => import('./components/admin/admin-inventory/admin-inventory.component').then(m => m.AdminInventoryComponent) },
      { path: 'customers', loadComponent: () => import('./components/admin/admin-customers/admin-customers.component').then(m => m.AdminCustomersComponent) },
      { path: 'orders', loadComponent: () => import('./components/admin/admin-orders/admin-orders.component').then(m => m.AdminOrdersComponent) },
      { path: 'payments', loadComponent: () => import('./components/admin/admin-payments/admin-payments.component').then(m => m.AdminPaymentsComponent) },
    ]
  },

  { path: '**', redirectTo: '' }
];
