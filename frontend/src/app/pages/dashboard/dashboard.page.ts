import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { FlatService } from '../../services/flat.service';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

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

  showCode = false;
  currentFlatCode: string | null = null;

  constructor(
    private flatService: FlatService,
    private api: ApiService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.flatService.selectedFlatId$().subscribe((flatId) => {
      this.selectedFlatId = flatId;
      if (flatId) {
        this.loadSummary(flatId);
      } else {
        this.tasks = [];
        this.pendingExpenses = [];
        this.harmonyScore = 0;
        this.currentFlatCode = null;
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
        const flatIds = this.flats.map(f => f.id || f.flat?.id).filter(Boolean);

        if (this.selectedFlatId && !flatIds.includes(this.selectedFlatId)) {
          this.selectedFlatId = null;
          this.flatService.setSelectedFlat('');
        }

        if (!this.selectedFlatId && flatIds.length > 0) {
          this.selectFlat(flatIds[0]);
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
    this.authService.logout();
  }

  toggleJoinCode() {
    this.showCode = !this.showCode;
  }

  loadSummary(flatId: string) {
    this.error = null;
    this.loading = true;
    this.currentFlatCode = null;
    this.showCode = false;

    this.api.get<any>(`flats/${flatId}`).subscribe({
      next: (flat) => {
        this.currentFlatCode = flat?.joinCode ?? null;
      }
    });

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
