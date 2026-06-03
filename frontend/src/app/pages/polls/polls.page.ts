import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FlatService } from '../../services/flat.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-polls',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './polls.page.html',
  styleUrls: ['./polls.page.scss'],
})
export class PollsPage implements OnInit {
  polls: any[] = [];
  selectedFlatId: string | null = null;
  error: string | null = null;

  constructor(private flatService: FlatService, private api: ApiService) {}

  ngOnInit() {
    this.selectedFlatId = this.flatService.getSelectedFlatId();
    if (this.selectedFlatId) {
      this.loadPolls();
    }
  }

  loadPolls() {
    this.api.get<any[]>(`flats/${this.selectedFlatId}/polls`).subscribe({
      next: (data) => (this.polls = data || []),
      error: (response) => (this.error = response?.error?.message || 'No se pudieron cargar las votaciones'),
    });
  }

  vote(pollId: string, optionId: string) {
    this.api.post(`flats/${this.selectedFlatId}/polls/${pollId}/vote`, { optionId }).subscribe({
      next: () => this.loadPolls(),
      error: (response) => (this.error = response?.error?.message || 'No se pudo enviar el voto'),
    });
  }
}
