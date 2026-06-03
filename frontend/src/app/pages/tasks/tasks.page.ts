import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FlatService } from '../../services/flat.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './tasks.page.html',
  styleUrls: ['./tasks.page.scss'],
})
export class TasksPage implements OnInit {
  tasks: any[] = [];
  selectedFlatId: string | null = null;
  error: string | null = null;

  constructor(private flatService: FlatService, private api: ApiService) {}

  ngOnInit() {
    this.selectedFlatId = this.flatService.getSelectedFlatId();
    if (this.selectedFlatId) {
      this.loadTasks();
    }
  }

  loadTasks() {
    this.api.get<any[]>(`flats/${this.selectedFlatId}/tasks`).subscribe({
      next: (data) => (this.tasks = data || []),
      error: (response) => (this.error = response?.error?.message || 'No se pudieron cargar las tareas'),
    });
  }

  completeTask(taskId: string) {
    this.api.post(`flats/${this.selectedFlatId}/tasks/complete`, { taskId }).subscribe({
      next: () => this.loadTasks(),
      error: (response) => (this.error = response?.error?.message || 'No se pudo completar la tarea'),
    });
  }
}
