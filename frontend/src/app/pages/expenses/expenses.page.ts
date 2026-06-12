import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
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
  currentUser: any = null;
  splitType: 'equitativo' | 'personalizado' = 'equitativo';
  memberSplits: { userId: string; firstName: string; lastName?: string; amount: number; isEdited: boolean }[] = [];

  private flatService = inject(FlatService);
  private api = inject(ApiService);
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private alertController = inject(AlertController);

  categories = [
    { value: 'GROCERIES', label: 'Comida' },
    { value: 'UTILITIES', label: 'Servicios' },
    { value: 'RENT', label: 'Alquiler' },
    { value: 'CLEANING', label: 'Limpieza' },
    { value: 'OTHER', label: 'Otro' },
  ];

  constructor() {
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
    this.currentUser = this.authService.getCurrentUser();
    this.flatService.selectedFlatId$().subscribe((flatId) => {
      this.selectedFlatId = flatId;
      if (flatId) {
        this.loadFlatDetails();
        this.loadExpenses();
        this.loadBalances();
      } else {
        this.members = [];
        this.memberSplits = [];
        this.expenses = [];
        this.balances = [];
      }
    });

    this.expenseForm.get('amount')?.valueChanges.subscribe(() => {
      if (this.splitType === 'equitativo') {
        this.initializeSplits();
      } else {
        // En modo personalizado, si cambia el total, lo reiniciamos de forma equitativa
        // para asegurar que las partes vuelvan a sumar el total.
        this.initializeSplits();
      }
    });
  }

  isUserInvolved(balance: any): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.id === balance.fromUserId || this.currentUser.id === balance.toUserId;
  }

  async payDebt(balance: any) {
    if (!this.selectedFlatId) return;

    const alert = await this.alertController.create({
      header: 'Confirmar Pago',
      message: `¿Estás seguro de que deseas marcar como pagada la deuda de ${balance.amount.toFixed(2)}€ de ${balance.fromName} a ${balance.toName}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: () => {
            this.loading = true;
            this.api.post(`flats/${this.selectedFlatId}/expenses/pay-debt`, {
              fromUserId: balance.fromUserId,
              toUserId: balance.toUserId,
              amount: balance.amount
            }).subscribe({
              next: () => {
                this.successMessage = 'Pago registrado y balances actualizados.';
                this.error = null;
                this.loadExpenses();
                this.loadBalances();
                this.loadFlatDetails();
              },
              error: (response) => {
                this.error = response?.error?.message || 'No se pudo registrar el pago';
                this.successMessage = null;
                this.loading = false;
              }
            });
          }
        }
      ]
    });

    await alert.present();
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
        this.initializeSplits();
        this.loading = false;
      },
      error: (response) => {
        this.error = response?.error?.message || 'No se pudieron cargar los miembros del piso';
        this.loading = false;
      },
    });
  }

  initializeSplits() {
    const totalAmount = this.expenseForm.get('amount')?.value || 0;
    if (this.members.length === 0) {
      this.memberSplits = [];
      return;
    }

    const equalAmount = Number((totalAmount / this.members.length).toFixed(2));
    let remaining = totalAmount;

    this.memberSplits = this.members.map((member, index) => {
      const value = index === this.members.length - 1 ? Number(remaining.toFixed(2)) : equalAmount;
      remaining -= value;
      return {
        userId: member.userId,
        firstName: member.firstName,
        lastName: member.lastName,
        amount: value,
        isEdited: false
      };
    });
  }

  setSplitType(type: 'equitativo' | 'personalizado') {
    this.splitType = type;
    this.initializeSplits();
  }

  onSplitInputChange(userId: string, event: any) {
    const val = parseFloat(event.target.value);
    const amount = isNaN(val) ? 0 : val;
    this.onSplitAmountChange(userId, amount);
    
    // Forzar el valor visual en el DOM para que coincida con el modelo (en caso de limitar el importe)
    const split = this.memberSplits.find(m => m.userId === userId);
    if (split && event.target) {
      event.target.value = split.amount;
    }
  }

  onSplitAmountChange(userId: string, newAmount: number) {
    const totalAmount = this.expenseForm.get('amount')?.value || 0;
    if (totalAmount <= 0) return;

    const targetIndex = this.memberSplits.findIndex(m => m.userId === userId);
    if (targetIndex === -1) return;

    // Marcamos como editado por el usuario
    this.memberSplits[targetIndex].isEdited = true;

    // Sumamos los importes de los otros miembros ya editados
    const otherEditedSum = this.memberSplits
      .filter((m, idx) => m.isEdited && idx !== targetIndex)
      .reduce((sum, m) => sum + m.amount, 0);

    // El límite máximo para este miembro es total - otros editados
    const maxAllowed = Math.max(0, totalAmount - otherEditedSum);
    const finalValue = Math.min(newAmount, maxAllowed);
    this.memberSplits[targetIndex].amount = Number(finalValue.toFixed(2));

    // Distribuimos el resto a los miembros no editados
    const editedSum = this.memberSplits
      .filter(m => m.isEdited)
      .reduce((sum, m) => sum + m.amount, 0);

    const remaining = Math.max(0, totalAmount - editedSum);
    const nonEditedMembers = this.memberSplits.filter(m => !m.isEdited);

    if (nonEditedMembers.length > 0) {
      const equalShare = Number((remaining / nonEditedMembers.length).toFixed(2));
      let rem = remaining;
      nonEditedMembers.forEach((m, idx) => {
        const share = idx === nonEditedMembers.length - 1 ? Number(rem.toFixed(2)) : equalShare;
        rem -= share;
        m.amount = Math.max(0, share);
      });
    }
  }

  get totalSplitsSum(): number {
    return this.memberSplits.reduce((sum, m) => sum + m.amount, 0);
  }

  get splitRemainingAmount(): number {
    const totalAmount = this.expenseForm.get('amount')?.value || 0;
    return Number((totalAmount - this.totalSplitsSum).toFixed(2));
  }

  isFormValid(): boolean {
    if (this.expenseForm.invalid) return false;
    if (this.splitType === 'personalizado') {
      const amount = Number(this.expenseForm.value.amount);
      return Math.abs(this.totalSplitsSum - amount) < 0.01;
    }
    return true;
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
    if (!this.isFormValid() || !this.selectedFlatId) {
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

    let splits: { userId: string; amount: number }[] = [];
    if (this.splitType === 'equitativo') {
      const equalAmount = Number((amount / this.members.length).toFixed(2));
      let remaining = amount;
      splits = this.members.map((member, index) => {
        const value = index === this.members.length - 1 ? Number(remaining.toFixed(2)) : equalAmount;
        remaining -= value;
        return { userId: member.userId, amount: value };
      });
    } else {
      splits = this.memberSplits.map(m => ({ userId: m.userId, amount: m.amount }));
    }

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
        this.splitType = 'equitativo';
        this.expenseForm.reset({ category: 'OTHER' });
        this.initializeSplits();
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
