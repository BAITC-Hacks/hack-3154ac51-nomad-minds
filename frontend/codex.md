# Angular Project Development Rules

## 1. Общие правила

Проект разрабатывается на **актуальной стабильной версии Angular**.

Основной стек:

- Angular
- TypeScript
- RxJS
- Tailwind CSS
- SCSS
- NG-ZORRO / Ant Design

Приложение используется только на **русском языке**.

Не добавлять систему локализации (`i18n`, Transloco, ngx-translate и т. п.), если это явно не требуется задачей.

Все тексты интерфейса писать на русском языке.

---

# 2. Структура проекта

Внутри функциональных модулей / feature-папок использовать следующую структуру:

```text
feature/
├── components/
├── services/
├── models/
├── directives/
├── pipes/
└── pages/
```

При необходимости допускаются дополнительные папки:

```text
utils/
constants/
guards/
interceptors/
validators/
```

Не создавать дополнительные уровни вложенности без необходимости.

---

# 3. Components

Все переиспользуемые компоненты размещать в:

```text
components/
```

Страницы, привязанные к маршрутам, размещать в:

```text
pages/
```

Компонент должен отвечать за отображение и взаимодействие с пользователем.

Бизнес-логику не размещать непосредственно в компоненте, если её можно вынести в сервис.

Предпочитать небольшие компоненты с одной ответственностью.

Для входных и выходных параметров использовать актуальные Angular API.

Не создавать собственный компонент, если задача нормально решается существующим компонентом NG-ZORRO.

---

# 4. Services

Сервисы размещать в:

```text
services/
```

Сервис должен отвечать за:

- HTTP-запросы;
- бизнес-логику;
- работу с состоянием;
- взаимодействие между компонентами;
- преобразование данных, если логика достаточно сложная.

Не размещать HTTP-запросы непосредственно в компонентах.

Пример:

```ts
@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/users');
  }
}
```

---

# 5. Models

Все модели данных размещать в:

```text
models/
```

Для описания моделей данных использовать **interface**.

Использовать:

```ts
export interface User {
  id: number;
  name: string;
  email: string;
}
```

Не использовать классы:

```ts
export class User {
}
```

если класс не содержит реальной логики и используется только как структура данных.

Для DTO также использовать интерфейсы.

Пример:

```ts
export interface CreateUserRequest {
  name: string;
  email: string;
}

export interface CreateUserResponse {
  id: number;
  name: string;
  email: string;
}
```

Не использовать `any`, если тип данных известен или может быть описан.

Предпочитать:

```ts
unknown
```

вместо:

```ts
any
```

если тип действительно неизвестен.

---

# 6. RxJS и подписки

Не оставлять ручные подписки без корректной отписки.

Если подписка создаётся в компоненте, директиве, pipe или другом объекте с жизненным циклом Angular, использовать:

```ts
takeUntilDestroyed(this.destroyRef)
```

Пример:

```ts
private readonly destroyRef = inject(DestroyRef);

ngOnInit(): void {
  this.userService
    .getUsers()
    .pipe(
      takeUntilDestroyed(this.destroyRef),
    )
    .subscribe(users => {
      this.users = users;
    });
}
```

Импорт:

```ts
import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
```

Не создавать вручную:

```ts
private readonly destroy$ = new Subject<void>();
```

и не использовать шаблон:

```ts
ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}
```

если можно использовать `takeUntilDestroyed`.

Для глобальных singleton-сервисов с:

```ts
providedIn: 'root'
```

`takeUntilDestroyed` обычно не требуется, если подписка должна существовать всё время жизни приложения.

Не делать вложенные `subscribe`.

Плохо:

```ts
this.userService.getUser().subscribe(user => {
  this.orderService.getOrders(user.id).subscribe(orders => {
    // ...
  });
});
```

Предпочитать RxJS-операторы:

```ts
this.userService
  .getUser()
  .pipe(
    switchMap(user => this.orderService.getOrders(user.id)),
    takeUntilDestroyed(this.destroyRef),
  )
  .subscribe(orders => {
    // ...
  });
```

Использовать подходящий оператор:

- `switchMap`
- `mergeMap`
- `concatMap`
- `exhaustMap`
- `map`
- `filter`
- `tap`
- `catchError`
- `combineLatest`
- `forkJoin`

в зависимости от задачи.

---

# 7. Signals

Для локального реактивного состояния предпочтительно использовать Angular Signals, если они упрощают реализацию.

Пример:

```ts
readonly loading = signal(false);
readonly users = signal<User[]>([]);
```

Вычисляемые значения делать через:

```ts
computed()
```

Пример:

```ts
readonly activeUsers = computed(() =>
  this.users().filter(user => user.active),
);
```

Не использовать `effect()` без необходимости.

Не использовать `effect()` как замену обычным методам, `computed()` или RxJS pipeline.

---

# 8. Dependency Injection

Предпочитать современный Angular DI через:

```ts
inject()
```

Пример:

```ts
private readonly userService = inject(UserService);
private readonly message = inject(NzMessageService);
private readonly destroyRef = inject(DestroyRef);
```

Не создавать зависимости вручную через `new`.

Плохо:

```ts
const service = new UserService();
```

---

# 9. TypeScript

Проект должен использовать строгую типизацию.

Не использовать `any` без крайней необходимости.

Всегда указывать типы:

- моделей;
- аргументов функций;
- возвращаемых значений публичных методов;
- API responses;
- API requests.

Пример:

```ts
getUser(id: number): Observable<User> {
  return this.http.get<User>(`/api/users/${id}`);
}
```

Использовать:

```ts
readonly
```

для свойств, которые не должны переназначаться.

Пример:

```ts
private readonly userService = inject(UserService);
```

Использовать `const` по умолчанию.

Использовать `let` только если значение действительно будет изменяться.

Не использовать `var`.

---

# 10. Naming

Названия должны быть понятными и отражать назначение сущности.

Использовать:

```text
user-list.component.ts
user.service.ts
user.model.ts
phone-mask.directive.ts
date-format.pipe.ts
```

Классы:

```ts
UserListComponent
UserService
PhoneMaskDirective
DateFormatPipe
```

Интерфейсы:

```ts
User
UserDetails
CreateUserRequest
UpdateUserRequest
```

Не использовать префикс `I`.

Плохо:

```ts
IUser
IUserResponse
```

Хорошо:

```ts
User
UserResponse
```

Boolean-переменные называть так, чтобы было понятно, что это логическое значение:

```ts
isLoading
isVisible
isDisabled
hasPermission
canEdit
```

---

# 11. Dates

Все отображаемые пользователю даты должны иметь формат:

```text
дд.мм.гггг
```

Пример:

```text
23.09.2026
```

При необходимости времени:

```text
дд.мм.гггг HH:mm
```

Пример:

```text
23.09.2026 14:30
```

В API и внутри модели допускается ISO-формат, если его использует backend:

```text
2026-09-23T14:30:00
```

Но пользователю дата всегда должна отображаться как:

```text
23.09.2026
```

Не писать форматирование дат вручную через конкатенацию строк, если можно использовать Angular DatePipe или отдельную utility-функцию.

---

# 12. Язык интерфейса

Весь пользовательский интерфейс должен быть на русском языке.

Примеры:

```html
<button>Сохранить</button>

<span>Удалить</span>

<h1>Список пользователей</h1>
```

Не писать:

```html
<button>Save</button>
```

если это не технический термин или значение, которое приходит от backend.

Сообщения об ошибках также писать на русском языке.

Например:

```ts
this.message.error('Не удалось загрузить данные');
```

---

# 13. NG-ZORRO

Для стандартных UI-элементов использовать NG-ZORRO:

- кнопки;
- таблицы;
- модальные окна;
- формы;
- dropdown;
- select;
- date picker;
- notifications;
- message;
- pagination;
- tooltip;
- popover;
- drawer;
- tabs.

Не создавать собственную реализацию стандартного UI-компонента, если аналог уже есть в NG-ZORRO.

Пример:

```html
<button
  nz-button
  nzType="primary"
>
  Сохранить
</button>
```

Для уведомлений использовать:

```ts
NzMessageService
```

или:

```ts
NzNotificationService
```

в зависимости от сценария.

---

# 14. Tailwind CSS

Tailwind использовать преимущественно для:

- layout;
- flex;
- grid;
- spacing;
- размеры;
- positioning;
- адаптивность;
- простые визуальные стили.

Пример:

```html
<div class="flex items-center justify-between gap-4">
```

Не создавать SCSS-класс только ради:

```scss
.container {
  display: flex;
  align-items: center;
  gap: 16px;
}
```

если то же самое нормально выражается Tailwind:

```html
<div class="flex items-center gap-4">
```

---

# 15. SCSS

SCSS использовать для:

- сложных стилей;
- специфичных стилей компонента;
- псевдоэлементов;
- сложных селекторов;
- переопределения стилей сторонних библиотек;
- случаев, когда Tailwind значительно ухудшает читаемость.

Не дублировать одни и те же стили одновременно в Tailwind и SCSS.

Не использовать глобальные стили без необходимости.

---

# 16. NG-ZORRO + Tailwind

Tailwind разрешается использовать вместе с NG-ZORRO.

Например:

```html
<button
  nz-button
  nzType="primary"
  class="w-full mt-4"
>
  Сохранить
</button>
```

При этом:

- поведение и базовый UI предоставляет NG-ZORRO;
- layout и расположение можно настраивать через Tailwind.

Не переопределять внутренние стили NG-ZORRO без необходимости.

---

# 17. Forms

Для сложных форм использовать Reactive Forms.

Предпочитать:

```ts
FormBuilder
FormGroup
FormControl
Validators
```

или актуальный typed Forms API Angular.

Формы должны быть типизированы.

Не использовать `ngModel` внутри Reactive Forms.

Валидацию не дублировать без необходимости.

Ошибки должны быть понятны пользователю.

Пример:

```text
Введите название

Поле обязательно для заполнения

Введите корректный email
```

---

# 18. HTTP

Все HTTP-запросы должны находиться в сервисах.

Компонент не должен напрямую использовать `HttpClient`.

Плохо:

```ts
export class UsersComponent {
  private readonly http = inject(HttpClient);
}
```

Хорошо:

```ts
export class UsersComponent {
  private readonly userService = inject(UserService);
}
```

API-модели должны быть типизированы.

Не использовать:

```ts
this.http.get<any>(...)
```

если структура ответа известна.

---

# 19. Error handling

Не игнорировать ошибки HTTP-запросов.

Если ошибка должна быть обработана непосредственно в текущем сценарии, использовать `catchError`.

Не создавать пустые обработчики:

```ts
error: () => {}
```

Если пользователь должен знать об ошибке, показать понятное сообщение на русском языке.

Пример:

```ts
this.message.error('Не удалось сохранить изменения');
```

Не показывать пользователю технические сообщения backend или stack trace без необходимости.

---

# 20. Loading state

При асинхронных операциях, которые пользователь может заметить, использовать состояние загрузки.

Например:

```ts
readonly isLoading = signal(false);
```

Не допускать повторной отправки формы во время сохранения.

Кнопка может использовать:

```html
[nzLoading]="isLoading()"
```

---

# 21. Templates

Не размещать сложную бизнес-логику внутри HTML.

Плохо:

```html
{{ users.filter(user => user.active && user.age > 18).length }}
```

Вынести вычисление в:

- `computed`;
- pipe;
- метод;
- заранее подготовленное значение.

Предпочитать читаемые шаблоны.

---

# 22. Control Flow

Использовать актуальный Angular template control flow.

Предпочитать:

```html
@if (isLoading()) {
<nz-spin />
}
```

и:

```html
@for (user of users(); track user.id) {
...
}
```

вместо устаревших вариантов, если проект использует современный Angular syntax.

Всегда использовать корректный `track` для списков.

---

# 23. Pipes

Pipes размещать в:

```text
pipes/
```

Pipe должен использоваться только для преобразования отображаемых данных.

Не помещать бизнес-логику в pipe.

По возможности pipe должен быть pure.

---

# 24. Directives

Директивы размещать в:

```text
directives/
```

Директива должна решать переиспользуемую задачу поведения DOM/UI.

Не создавать директиву для логики, которая используется только один раз и проще реализуется непосредственно в компоненте.

---

# 25. Повторное использование

Перед созданием нового:

- компонента;
- pipe;
- directive;
- service;
- utility;
- interface

проверить, нет ли уже аналогичной реализации в проекте.

Не создавать дубликаты.

Общую логику выносить для повторного использования только тогда, когда это действительно уменьшает дублирование.

Не создавать абстракции заранее без реальной необходимости.

---

# 26. Простота решения

Предпочитать самое простое решение, которое:

- понятно;
- типизировано;
- легко поддерживается;
- соответствует Angular conventions;
- не создаёт лишнюю архитектурную сложность.

Не создавать лишние:

- facade;
- repository;
- manager;
- handler;
- adapter;
- mapper

если задача этого не требует.

---

# 27. Комментарии

Не писать комментарии, которые просто повторяют код.

Плохо:

```ts
// Получаем пользователей
this.getUsers();
```

Комментарии использовать только для объяснения:

- неочевидного решения;
- workaround;
- сложного алгоритма;
- причины необычного поведения.

---

# 28. Константы

Не использовать magic values.

Плохо:

```ts
if (status === 3) {
}
```

Предпочитать enum, union type или именованную константу.

Например:

```ts
export const MAX_FILE_SIZE_MB = 10;
```

Если набор значений приходит с backend и является конечным, использовать подходящий тип.

---

# 29. Изменение существующего кода

При выполнении задачи Codex должен:

1. Сначала изучить существующую реализацию.
2. Следовать текущей архитектуре проекта.
3. Не переписывать код, который не относится к задаче.
4. Не проводить большой рефакторинг без необходимости.
5. Не менять публичные API без причины.
6. Не удалять существующую функциональность.
7. Не изменять внешний вид соседних компонентов без необходимости.
8. Минимизировать размер diff.

Если существующий подход неидеален, но его изменение не требуется задачей — не переписывать его без необходимости.

---

# 30. После выполнения задачи

После изменения кода проверить:

```bash
npm run build
```

или соответствующую команду сборки проекта.

Если в проекте настроены lint и tests, также выполнить:

```bash
npm run lint
```

и:

```bash
npm test
```

Исправить:

- TypeScript errors;
- Angular template errors;
- lint errors;
- отсутствующие imports;
- ошибки сборки,

которые появились из-за внесённых изменений.

---

# 31. Главное правило

При генерации или изменении кода придерживаться следующего приоритета:

```text
Корректность
↓
Типобезопасность
↓
Простота
↓
Читаемость
↓
Переиспользование
↓
Минимальный diff
```

Не усложнять архитектуру без объективной необходимости.
