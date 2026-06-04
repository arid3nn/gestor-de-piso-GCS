import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FlatService } from '../../services/flat.service';
import { ApiService } from '../../services/api.service';

interface FlatMember {
  userId: string;
  firstName: string;
  lastName?: string;
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tasks.page.html',
  styleUrls: ['./tasks.page.scss'],
})
export class TasksPage implements OnInit {
  taskForm: FormGroup;
  tasks: any[] = [];
  members: FlatMember[] = [];
  selectedFlatId: string | null = null;
  error: string | null = null;
  loading = false;
  creating = false;

  frequencyOptions = [
    { value: 'ONCE', label: 'Única' },
    { value: 'DAILY', label: 'Diaria' },
    { value: 'WEEKLY', label: 'Semanal' },
    { value: 'MONTHLY', label: 'Mensual' },
  ];

  constructor(
    private flatService: FlatService,
    private api: ApiService,
    private fb: FormBuilder
  ) {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required]],
      description: [''],
      frequency: ['ONCE', [Validators.required]],
      dueDate: [''],
      assignedToId: [''],
    });
  }

  ngOnInit() {
    this.selectedFlatId = this.flatService.getSelectedFlatId();
    this.flatService.selectedFlatId$().subscribe((flatId) => {
      this.selectedFlatId = flatId;
      if (flatId) {
        this.loadTasks();
        this.loadMembers(flatId);
      }
    });
    if (this.selectedFlatId) {
      this.loadTasks();
      this.loadMembers(this.selectedFlatId);
    }
  }

  loadMembers(flatId: string) {
    this.loading = true;
    this.api.get<any>(`flats/${flatId}`).subscribe({
      next: (flat) => {
        this.members = (flat.members || []).map((member: any) => ({
          userId: member.user?.id ?? member.userId,
          firstName: member.user?.firstName ?? '',
          lastName: member.user?.lastName ?? '',
        }));
        this.loading = false;
      },
      error: (response) => {
        this.error = response?.error?.message || 'No se pudieron cargar los miembros';
        this.loading = false;
      },
    });
  }

  loadTasks() {
    if (!this.selectedFlatId) return;
    this.api.get<any[]>(`flats/${this.selectedFlatId}/tasks`).subscribe({
      next: (data) => {
        this.tasks = data || [];
      },
      error: (response) => {
        this.error = response?.error?.message || 'No se pudieron cargar las tareas';
      },
    });
  }

  completeTask(taskId: string) {
    if (!this.selectedFlatId) return;
    this.api.post(`flats/${this.selectedFlatId}/tasks/complete`, { taskId }).subscribe({
      next: () => this.loadTasks(),
      error: (response) => {
        this.error = response?.error?.message || 'No se pudo completar la tarea';
      },
    });
  }

  createTask() {
    if (!this.selectedFlatId) return;
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const payload = {
      title: this.taskForm.value.title,
      description: this.taskForm.value.description,
      frequency: this.taskForm.value.frequency,
      dueDate: this.taskForm.value.dueDate || null,
      assignedToId: this.taskForm.value.assignedToId || null,
    };

    this.creating = true;
    this.error = null;

    this.api.post(`flats/${this.selectedFlatId}/tasks`, payload).subscribe({
      next: () => {
        this.creating = false;
        this.taskForm.reset({ frequency: 'ONCE', assignedToId: '' });
        this.loadTasks();
      },
      error: (response) => {
        this.creating = false;
        this.error = response?.error?.message || 'No se pudo crear la tarea';
      },
    });
  }
}
