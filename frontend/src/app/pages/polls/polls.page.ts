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
  selector: 'app-polls',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
  templateUrl: './polls.page.html',
  styleUrls: ['./polls.page.scss'],
})
export class PollsPage implements OnInit {
  pollForm: FormGroup;
  polls: any[] = [];
  selectedFlatId: string | null = null;
  members: FlatMember[] = [];
  error: string | null = null;
  creating = false;
  loading = false;

  constructor(
    private flatService: FlatService,
    private api: ApiService,
    private fb: FormBuilder
  ) {
    this.pollForm = this.fb.group({
      question: ['', [Validators.required]],
      optionA: ['', [Validators.required]],
      optionB: ['', [Validators.required]],
      optionC: [''],
      expiresAt: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    this.selectedFlatId = this.flatService.getSelectedFlatId();
    this.flatService.selectedFlatId$().subscribe((flatId) => {
      this.selectedFlatId = flatId;
      if (flatId) {
        this.loadPolls();
        this.loadMembers(flatId);
      }
    });
    if (this.selectedFlatId) {
      this.loadPolls();
      this.loadMembers(this.selectedFlatId);
    }
  }

  get activePolls(): any[] {
    const now = new Date();
    return this.polls.filter((poll) => !poll.expiresAt || new Date(poll.expiresAt) >= now);
  }

  get finishedPolls(): any[] {
    const now = new Date();
    return this.polls.filter((poll) => poll.expiresAt && new Date(poll.expiresAt) < now);
  }

  getPollWinner(poll: any): { text: string; votes: number } | null {
    if (!poll.options || poll.options.length === 0) return null;
    let winner = poll.options[0];
    let maxVotes = winner._count?.votes || 0;

    for (let i = 1; i < poll.options.length; i++) {
      const opt = poll.options[i];
      const votes = opt._count?.votes || 0;
      if (votes > maxVotes) {
        winner = opt;
        maxVotes = votes;
      }
    }

    if (maxVotes === 0) {
      return null;
    }

    return {
      text: winner.text,
      votes: maxVotes,
    };
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

  loadPolls() {
    if (!this.selectedFlatId) return;
    this.api.get<any[]>(`flats/${this.selectedFlatId}/polls`).subscribe({
      next: (data) => {
        this.polls = data || [];
      },
      error: (response) => {
        this.error = response?.error?.message || 'No se pudieron cargar las votaciones';
      },
    });
  }

  vote(pollId: string, optionId: string) {
    if (!this.selectedFlatId) return;
    this.api.post(`flats/${this.selectedFlatId}/polls/${pollId}/vote`, { optionId }).subscribe({
      next: () => this.loadPolls(),
      error: (response) => {
        this.error = response?.error?.message || 'No se pudo enviar el voto';
      },
    });
  }

  createPoll() {
    if (!this.selectedFlatId) return;
    if (this.pollForm.invalid) {
      this.pollForm.markAllAsTouched();
      return;
    }

    const options = [
      this.pollForm.value.optionA,
      this.pollForm.value.optionB,
    ].filter(Boolean);

    if (this.pollForm.value.optionC) {
      options.push(this.pollForm.value.optionC);
    }

    this.creating = true;
    this.error = null;

    this.api.post(`flats/${this.selectedFlatId}/polls`, {
      question: this.pollForm.value.question,
      expiresAt: this.pollForm.value.expiresAt,
      options,
    }).subscribe({
      next: () => {
        this.creating = false;
        this.pollForm.reset();
        this.loadPolls();
      },
      error: (response) => {
        this.creating = false;
        this.error = response?.error?.message || 'No se pudo crear la votación';
      },
    });
  }
}
