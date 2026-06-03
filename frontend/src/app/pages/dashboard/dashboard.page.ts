import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FlatService } from '../../services/flat.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  flats: any[] = [];
  selectedFlatId: string | null = null;
  loading = false;
  error: string | null = null;

  constructor(private flatService: FlatService) {}

  ngOnInit() {
    this.loadFlats();
  }

  loadFlats() {
    this.loading = true;
    this.flatService.getMyFlats().subscribe({
      next: (flats) => {
        this.flats = flats || [];
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
  }
}
