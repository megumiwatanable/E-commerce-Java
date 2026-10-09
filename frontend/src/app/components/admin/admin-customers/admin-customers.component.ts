import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../../../models/user.model';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

interface CustomerForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  status: CustomerStatus;
}

const EMPTY_CUSTOMER_FORM: CustomerForm = {
  firstName: '', lastName: '', email: '', phone: '', password: '', status: 'ACTIVE'
};

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-customers.component.html',
  styleUrl: './admin-customers.component.css'
})
export class AdminCustomersComponent implements OnInit {
  customers: User[] = [];
  form: CustomerForm = { ...EMPTY_CUSTOMER_FORM };
  editingCustomer?: User;
  showForm = false;

  constructor(
    private readonly authService: AuthService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void { this.loadCustomers(); }

  loadCustomers(): void {
    this.authService.getUsers().subscribe({
      next: response => { this.customers = response.data ?? []; },
      error: () => this.toastService.error('Could not load customers.')
    });
  }

  openForm(customer?: User): void {
    this.editingCustomer = customer;
    this.form = customer ? this.toForm(customer) : { ...EMPTY_CUSTOMER_FORM };
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingCustomer = undefined;
    this.form = { ...EMPTY_CUSTOMER_FORM };
  }

  saveCustomer(): void {
    const request = this.editingCustomer
      ? this.authService.updateUser(this.editingCustomer.id, this.form)
      : this.authService.createUser(this.form);

    request.subscribe({
      next: () => {
        const action = this.editingCustomer ? 'updated' : 'created';
        this.toastService.success(`Customer ${action}.`);
        this.closeForm();
        this.loadCustomers();
      },
      error: error => this.toastService.error(error.error?.message ?? 'Could not save customer.')
    });
  }

  deactivateCustomer(customer: User): void {
    if (!confirm(`Deactivate ${customer.email}?`)) return;

    this.authService.deleteUser(customer.id).subscribe({
      next: () => {
        this.toastService.success('Customer deactivated.');
        this.loadCustomers();
      },
      error: error => this.toastService.error(error.error?.message ?? 'Could not deactivate customer.')
    });
  }

  private toForm(customer: User): CustomerForm {
    return {
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone ?? '',
      password: '',
      status: customer.status as CustomerStatus
    };
  }
}
