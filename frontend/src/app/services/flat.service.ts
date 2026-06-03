import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class FlatService {
  private flatIdSubject = new BehaviorSubject<string | null>(null);

  constructor(private api: ApiService) {}

  setSelectedFlat(flatId: string) {
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
}
