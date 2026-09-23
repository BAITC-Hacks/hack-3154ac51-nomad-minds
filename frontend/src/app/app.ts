import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppHeader } from './features/scenario/components/app-header/app-header';
import { AppAlerts } from './shared/components/app-alerts/app-alerts';

@Component({
  imports: [AppHeader, RouterOutlet, AppAlerts],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {}
