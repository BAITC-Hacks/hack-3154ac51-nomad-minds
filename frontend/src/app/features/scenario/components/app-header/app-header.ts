import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ScenarioStoreService } from '../../services/scenario-store.service';

@Component({
  selector: 'app-header',
  imports: [NzAvatarModule, NzButtonModule, NzIconModule, RouterLink, RouterLinkActive],
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss',
})
export class AppHeader {
  protected readonly store = inject(ScenarioStoreService);
}
