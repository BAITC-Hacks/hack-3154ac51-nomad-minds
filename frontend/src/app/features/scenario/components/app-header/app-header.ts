import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { ScenarioStoreService } from '../../services/scenario-store.service';

@Component({
  selector: 'app-header',
  imports: [
    NzAvatarModule,
    NzIconModule,
    NzProgressModule,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss',
})
export class AppHeader {
  protected readonly store = inject(ScenarioStoreService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly now = signal(new Date());

  private readonly dateFormatter = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  private readonly timeFormatter = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  protected readonly currentDate = computed(() => this.dateFormatter.format(this.now()));
  protected readonly currentTime = computed(() => this.timeFormatter.format(this.now()));

  constructor() {
    const timerId = setInterval(() => this.now.set(new Date()), 1_000);
    this.destroyRef.onDestroy(() => clearInterval(timerId));
  }
}
