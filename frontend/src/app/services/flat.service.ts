import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class FlatService {
  private flatIdSubject = new BehaviorSubject<string | null>(localStorage.getItem('selected_flat_id'));

  constructor(private api: ApiService) {}

  setSelectedFlat(flatId: string) {
    localStorage.setItem('selected_flat_id', flatId);
    this.flatIdSubject.next(flatId);
  }

  getSelectedFlatId() {
    return this.flatIdSubject.value;
  }

  selectedFlatId$() {
    return this.flatIdSubject.asObservable();
  }

  getMyFlats() {
    return this.api.get<any[]>('flats');
  }

  createFlat(name: string) {
    return this.api.post<any>('flats/create', { name });
  }

  joinFlat(joinCode: string) {
    return this.api.post<any>('flats/join', { joinCode });
  }
}
