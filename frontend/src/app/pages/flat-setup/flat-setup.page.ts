import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FlatService } from '../../services/flat.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-flat-setup',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './flat-setup.page.html',
  styleUrls: ['./flat-setup.page.scss'],
})
export class FlatSetupPage {
  segment: 'create' | 'join' = 'create';
  createForm: FormGroup;
  joinForm: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private flatService: FlatService,
    private router: Router
  ) {
    this.createForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
    });

    this.joinForm = this.fb.group({
      joinCode: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  setSegment(value: 'create' | 'join') {
    this.segment = value;
    this.error = null;
  }

  setSegmentFromEvent(e: any) {
    const v = e?.detail?.value;
    if (v === 'create' || v === 'join') {
      this.setSegment(v);
    }
  }

  create() {
    if (this.createForm.invalid) return;
    this.loading = true;
    this.flatService.createFlat(this.createForm.value.name).subscribe({
      next: (res) => {
        const id = res?.id || res?.flat?.id;
        if (id) {
          this.flatService.setSelectedFlat(id);
          this.router.navigate(['/tabs/home']);
        }
        this.loading = false;
      },
      error: (e) => {
        this.error = e?.error?.message || 'Error creating flat';
        this.loading = false;
      }
    });
  }

  join() {
    if (this.joinForm.invalid) return;
    this.loading = true;
    this.flatService.joinFlat(this.joinForm.value.joinCode).subscribe({
      next: (res) => {
        const id = res?.id || res?.flat?.id || res?.flatId;
        if (id) {
          this.flatService.setSelectedFlat(id);
          this.router.navigate(['/tabs/home']);
        }
        this.loading = false;
      },
      error: (e) => {
        this.error = e?.error?.message || 'Error joining flat';
        this.loading = false;
      }
    });
  }
}
