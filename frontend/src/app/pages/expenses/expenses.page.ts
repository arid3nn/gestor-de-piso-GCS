import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FlatService } from '../../services/flat.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './expenses.page.html',
  styleUrls: ['./expenses.page.scss'],
})
export class ExpensesPage implements OnInit {
  expenses: any[] = [];
  balances: any[] = [];
  selectedFlatId: string | null = null;
  error: string | null = null;

  constructor(private flatService: FlatService, private api: ApiService) {}

  ngOnInit() {
    this.selectedFlatId = this.flatService.getSelectedFlatId();
    if (this.selectedFlatId) {
      this.loadExpenses();
      this.loadBalances();
    }
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
}
