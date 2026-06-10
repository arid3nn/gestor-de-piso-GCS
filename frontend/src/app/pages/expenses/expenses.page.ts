import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FlatService } from '../../services/flat.service';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

interface FlatMember {
  userId: string;
  firstName: string;
  lastName?: string;
}

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
  templateUrl: './expenses.page.html',
  styleUrls: ['./expenses.page.scss'],
})
export class ExpensesPage implements OnInit {
  expenseForm: FormGroup;
  expenses: any[] = [];
  balances: any[] = [];
  members: FlatMember[] = [];
  selectedFlatId: string | null = null;
  error: string | null = null;
  successMessage: string | null = null;
  loading = false;
  creating = false;

  categories = [
    { value: 'GROCERIES', label: 'Comida' },
    { value: 'UTILITIES', label: 'Servicios' },
    { value: 'RENT', label: 'Alquiler' },
    { value: 'CLEANING', label: 'Limpieza' },
    { value: 'OTHER', label: 'Otro' },
  ];

  constructor(
    private flatService: FlatService,
    private api: ApiService,
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {
    this.expenseForm = this.formBuilder.group({
      title: ['', [Validators.required]],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      category: ['OTHER'],
    });
  }

  get balanceTotal(): number {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return 0;
    const currentUserName = `${currentUser.firstName} ${currentUser.lastName || ''}`.trim();
    
    let total = 0;
    for (const b of this.balances) {
      if (b.fromName.toLowerCase() === currentUserName.toLowerCase() || b.fromName.toLowerCase() === currentUser.firstName.toLowerCase()) {
        total -= b.amount;
      } else if (b.toName.toLowerCase() === currentUserName.toLowerCase() || b.toName.toLowerCase() === currentUser.firstName.toLowerCase()) {
        total += b.amount;
      }
    }
    return Number(total.toFixed(2));
  }

  get monthlyExpenses(): number {
    return Number(this.expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0).toFixed(2));
  }

  ngOnInit() {
    this.selectedFlatId = this.flatService.getSelectedFlatId();
    if (this.selectedFlatId) {
      this.loadFlatDetails();
      this.loadExpenses();
      this.loadBalances();
    }
  }

  loadFlatDetails() {
    this.loading = true;
    this.api.get<any>(`flats/${this.selectedFlatId}`).subscribe({
      next: (data) => {
        this.members = (data?.members || []).map((member: any) => ({
          userId: member.user?.id ?? member.userId,
          firstName: member.user?.firstName ?? '',
          lastName: member.user?.lastName ?? '',
        }));
        this.loading = false;
      },
      error: (response) => {
        this.error = response?.error?.message || 'No se pudieron cargar los miembros del piso';
        this.loading = false;
      },
    });
  }

  loadExpenses() {
    this.api.get<any[]>(`flats/${this.selectedFlatId}/expenses`).subscribe({
      next: (data) => (this.expenses = data || []),
      error: (response) => (this.error = response?.error?.message || 'No se pudieron cargar los gastos'),
    });
  }

  loadBalances() {
    this.api.get<any[]>(`flats/${this.selectedFlatId}/expenses/balances`).subscribe({
      next: (data) => (this.balances = data || []),
      error: (response) => (this.error = response?.error?.message || 'No se pudieron cargar los saldos'),
    });
  }

  createExpense() {
    if (this.expenseForm.invalid || !this.selectedFlatId) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    if (!this.members.length) {
      this.error = 'No hay miembros en el piso para dividir el gasto.';
      return;
    }

    const amount = Number(this.expenseForm.value.amount);
    const title = this.expenseForm.value.title;
    const category = this.expenseForm.value.category;

    const equalAmount = Number((amount / this.members.length).toFixed(2));
    let remaining = amount;
    const splits = this.members.map((member, index) => {
      const value = index === this.members.length - 1 ? Number(remaining.toFixed(2)) : equalAmount;
      remaining -= value;
      return { userId: member.userId, amount: value };
    });

    this.creating = true;
    this.error = null;
    this.successMessage = null;

    this.api.post(`flats/${this.selectedFlatId}/expenses`, {
      title,
      amount,
      category,
      splits,
    }).subscribe({
      next: () => {
        this.creating = false;
        this.successMessage = 'Gasto registrado correctamente.';
        this.expenseForm.reset({ category: 'OTHER' });
        this.loadExpenses();
        this.loadBalances();
      },
      error: (response) => {
        this.creating = false;
        this.error = response?.error?.message || 'No se pudo crear el gasto';
      },
    });
  }
}
