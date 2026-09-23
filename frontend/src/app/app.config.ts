import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { provideNzI18n, ru_RU } from 'ng-zorro-antd/i18n';
import {
  AimOutline,
  ArrowDownOutline,
  ArrowUpOutline,
  BankOutline,
  BarChartOutline,
  BranchesOutline,
  BulbFill,
  CheckCircleFill,
  CheckOutline,
  ClockCircleOutline,
  CloseOutline,
  CompassOutline,
  DownOutline,
  ExclamationCircleFill,
  InboxOutline,
  InfoCircleFill,
  PlayCircleOutline,
  RightOutline,
  RobotOutline,
  SafetyCertificateOutline,
  SaveOutline,
  SearchOutline,
  ThunderboltOutline,
  UserOutline,
} from '@ant-design/icons-angular/icons';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(),
    provideRouter(routes),
    provideNzI18n(ru_RU),
    provideNzIcons([
      AimOutline,
      ArrowDownOutline,
      ArrowUpOutline,
      BankOutline,
      BarChartOutline,
      BranchesOutline,
      BulbFill,
      CheckCircleFill,
      CheckOutline,
      ClockCircleOutline,
      CloseOutline,
      CompassOutline,
      DownOutline,
      ExclamationCircleFill,
      InboxOutline,
      InfoCircleFill,
      PlayCircleOutline,
      RightOutline,
      RobotOutline,
      SafetyCertificateOutline,
      SaveOutline,
      SearchOutline,
      ThunderboltOutline,
      UserOutline,
    ]),
  ],
};
