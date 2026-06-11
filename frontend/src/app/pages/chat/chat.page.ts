import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, IonContent } from '@ionic/angular';
import { FlatService } from '../../services/flat.service';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage implements OnInit {
  @ViewChild(IonContent, { static: false }) content!: IonContent;

  messages: any[] = [];
  selectedFlatId: string | null = null;
  currentUser: any = null;
  newMessageText = '';
  loading = false;
  error: string | null = null;
  sending = false;

  constructor(
    private flatService: FlatService,
    private api: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.flatService.selectedFlatId$().subscribe((flatId) => {
      this.selectedFlatId = flatId;
      if (flatId) {
        this.loadMessages();
      } else {
        this.messages = [];
      }
    });
  }

  ionViewDidEnter() {
    this.scrollToBottom();
  }

  loadMessages() {
    if (!this.selectedFlatId) return;
    this.loading = true;
    this.api.get<any[]>(`flats/${this.selectedFlatId}/messages`).subscribe({
      next: (data) => {
        this.messages = data || [];
        this.loading = false;
        this.scrollToBottom();
      },
      error: (response) => {
        this.error = response?.error?.message || 'No se pudieron cargar los mensajes';
        this.loading = false;
      },
    });
  }

  sendMessage() {
    if (!this.selectedFlatId || !this.newMessageText.trim() || this.sending) {
      return;
    }

    const textToSend = this.newMessageText.trim();
    this.newMessageText = '';
    this.sending = true;

    this.api.post(`flats/${this.selectedFlatId}/messages`, {
      content: textToSend
    }).subscribe({
      next: (newMsg: any) => {
        const userDetails = this.currentUser ? {
          id: this.currentUser.id,
          firstName: this.currentUser.firstName,
          lastName: this.currentUser.lastName,
          email: this.currentUser.email
        } : null;

        this.messages.push({
          ...newMsg,
          user: userDetails
        });
        
        this.sending = false;
        this.scrollToBottom();
      },
      error: (response) => {
        this.error = response?.error?.message || 'No se pudo enviar el mensaje';
        this.sending = false;
      }
    });
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.content) {
        this.content.scrollToBottom(200);
      }
    }, 100);
  }
}
