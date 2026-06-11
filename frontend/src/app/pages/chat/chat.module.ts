import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ChatPage } from './chat.page';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: ChatPage }]),
  ],
})
export class ChatPageModule {}
