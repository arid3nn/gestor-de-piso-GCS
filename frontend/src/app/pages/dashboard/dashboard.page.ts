import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { FlatService } from '../../services/flat.service';
import { ApiService } from '../../services/api.service';

interface TaskSummary {
  id: string;
  title: string;
  dueDate?: string;
  assignedToName?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  flats: any[] = [];
  selectedFlatId: string | null = null;
  tasks: TaskSummary[] = [];
  pendingExpenses: any[] = [];
  harmonyScore = 0;
  loading = false;
  error: string | null = null;

  constructor(
    private flatService: FlatService,
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    this.flatService.selectedFlatId$().subscribe((flatId) => {
      this.selectedFlatId = flatId;
      if (flatId) {
        this.loadSummary(flatId);
      }
    });
    this.loadFlats();
  }

  loadFlats() {
    this.loading = true;
    this.error = null;
    this.flatService.getMyFlats().subscribe({
      next: (flats) => {
        this.flats = flats || [];
        if (!this.selectedFlatId && this.flats.length > 0) {
          const firstFlatId = this.flats[0].id || this.flats[0].flat?.id;
          if (firstFlatId) {
            this.selectFlat(firstFlatId);
          }
        }
        this.loading = false;
      },
      error: (response) => {
        this.error = response?.error?.message || 'No se han podido cargar los pisos';
        this.loading = false;
      },
    });
  }

  selectFlat(flatId: string) {
    this.selectedFlatId = flatId;
    this.flatService.setSelectedFlat(flatId);
    this.loadSummary(flatId);
  }

  goToSetup() {
    this.router.navigate(['/setup']); // antes era /tabs/setup
  }

  logout() {
    this.router.navigate(['/login']);
  }

  loadSummary(flatId: string) {
    this.error = null;
    this.loading = true;

    const tasks$ = this.api.get<any[]>(`flats/${flatId}/tasks`);
    const balances$ = this.api.get<any[]>(`flats/${flatId}/expenses/balances`);

    tasks$.subscribe({
      next: (tasks) => {
        const allTasks = tasks || [];
        this.tasks = allTasks.slice(0, 3).map((task) => ({
          id: task.id,
          title: task.title,
          dueDate: task.dueDate,
          assignedToName: task.assignedTo?.firstName ?? 'Sin asignar',
        }));
        this.updateHarmony(allTasks, this.pendingExpenses);
        this.loading = false;
      },
      error: (response) => {
        this.error = response?.error?.message || 'No se pudieron cargar las tareas';
        this.loading = false;
      },
    });

    balances$.subscribe({
      next: (balances) => {
        this.pendingExpenses = balances || [];
        this.updateHarmony(this.tasks, balances || []);
      },
      error: (response) => {
        this.error = response?.error?.message || 'No se pudieron cargar los gastos pendientes';
      },
    });
  }

  updateHarmony(tasks: any[], balances: any[]) {
    const pendingTasks = tasks.length;
    const totalPending = balances.reduce((sum, balance) => sum + Number(balance.amount || 0), 0);
    const taskScore = Math.max(0, 100 - pendingTasks * 10);
    const expensePenalty = Math.min(40, Math.round(totalPending / 5));
    this.harmonyScore = Math.max(35, taskScore - expensePenalty);
  }
}
