import { Component, inject } from '@angular/core';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AppAlertService } from '../../../core/services/app-alert.service';

@Component({
  selector: 'app-alerts',
  imports: [NzAlertModule, NzIconModule],
  templateUrl: './app-alerts.html',
  styleUrl: './app-alerts.scss',
})
export class AppAlerts {
  protected readonly notifications = inject(AppAlertService);
}
