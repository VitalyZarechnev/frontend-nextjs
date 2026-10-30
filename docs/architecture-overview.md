# Архитектура frontend-nextjs — обзор

> Описательный разбор того, как устроено приложение: слои, работа с `@tanstack/react-query`, работа с UI-компонентами, наблюдения и риски.
> Нормативные правила — в [AGENTS.md](/Users/developer/projects/frontend-nextjs/AGENTS.md) и [docs/agents/](/Users/developer/projects/frontend-nextjs/docs/agents/README.md). Этот файл их не заменяет, а объясняет «как есть».

**Стек:** Next.js 16 (App Router, Turbopack), React 19 + React Compiler, TypeScript, SCSS-модули, TanStack Query v5, MobX, react-hook-form + Zod, Vitest + Playwright (pixel-perfect).

---

## 1. Общая схема

Восемь каталогов в `/src`, зависимости направлены к домену:

```
app/(route)/page.tsx  →  views/  →  features/  →  ui/
                                        ↓
                                     domain/  ←  data/
                                        ↑
                                 application/ (DI, провайдеры)
```

| Слой           | Путь                                                                                                                                       | Что внутри                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Routes         | [`app/`](/Users/developer/projects/frontend-nextjs/app)                                                                                    | Только роутинг и композиция вью. Группы `(auth)`, `(domain)`.                              |
| Views          | [`src/views/`](/Users/developer/projects/frontend-nextjs/src/views)                                                                        | Один экран на роут, вёрстка и композиция фич. Запросов не делает.                          |
| Features       | [`src/features/`](/Users/developer/projects/frontend-nextjs/src/features)                                                                  | Единственное место, где живут данные: датасорсы, use-cases, формы, MobX.                   |
| UI             | [`src/ui/`](/Users/developer/projects/frontend-nextjs/src/ui)                                                                              | Презентационные атомы/молекулы, зависят только от `utils`.                                 |
| Domain         | [`src/domain/`](/Users/developer/projects/frontend-nextjs/src/domain)                                                                      | Zod-модели, интерфейсы `I*Datasource` / `I*Storage`, use-cases, доменные ошибки.           |
| Data           | [`src/data/`](/Users/developer/projects/frontend-nextjs/src/data)                                                                          | Реализации: `PostsDatasourceImpl`, `HttpClientImpl`, `TokenManagerImpl`, cookie-хранилища. |
| Application    | [`src/application/`](/Users/developer/projects/frontend-nextjs/src/application)                                                            | DI-реестр, `ApplicationProvider`, `AuthorizationWrapper`, `routes.ts`.                     |
| Utils / Errors | [`src/utils/`](/Users/developer/projects/frontend-nextjs/src/utils), [`src/errors/`](/Users/developer/projects/frontend-nextjs/src/errors) | Чистые утилиты по сегментам; общие ошибки приложения и HTTP.                               |

Зависимости достаются из синглтона `registry` — [AppRegistry.ts](/Users/developer/projects/frontend-nextjs/src/application/di/AppRegistry.ts), который при импорте сам себя бутстрапит: `clientBootstrap` или `serverBootstrap` в зависимости от `isBrowser()`, с разной стратегией хранилища (клиентские cookies vs серверные). Регистрация зависимостей — [AppBootstrap.ts](/Users/developer/projects/frontend-nextjs/src/application/di/AppBootstrap.ts).

Авторизация: токен в cookies, пишется в [TokenManagerImpl.ts](/Users/developer/projects/frontend-nextjs/src/data/network/token/TokenManagerImpl.ts), проверяется в [AuthorizationWrapper.tsx](/Users/developer/projects/frontend-nextjs/src/application/authorization/AuthorizationWrapper.tsx) через `useSyncExternalStore` над cookies с редиректом на `/login`. В корневом [layout.tsx](/Users/developer/projects/frontend-nextjs/app/layout.tsx) до рендера вызывается `bindServerRequestCookies()`.

---

## 2. Работа с @tanstack/react-query

Главное правило: **`useQuery` и `useMutation` не вызываются в компонентах напрямую**. Есть ровно две обёртки, и обе инстанцируются на верхнем уровне модуля, а не внутри компонента.

### Провайдер

[ApplicationProvider.tsx](/Users/developer/projects/frontend-nextjs/src/application/ApplicationProvider.tsx) — клиентский компонент в корневом layout. `QueryClient` создаётся один раз на уровне модуля, дефолты: `staleTime: 0`, `refetchOnWindowFocus: false`. Никаких других настроек (retry, gcTime, hydration) нет.

### Чтения — `createDatasource`

[utils/datasource.ts](/Users/developer/projects/frontend-nextjs/src/utils/datasource.ts) принимает экземпляр датасорса и через рефлексию обходит его прототип, собирая все публичные async-методы (всё, что не начинается с `_`). На каждый метод генерируется хук `use<Method>`:

- `getPosts()` → `useGetPosts(args?, opts?)`
- `getPostById(id)` → `useGetPostById([id], opts?)`

Аргументы передаются **массивом-кортежем**, типизированным как `Parameters<T[K]>`. Ключ кэша выводится автоматически: `[ "PostsDatasourceImpl.getPosts", ...args ]` — имя класса плюс имя метода. Тип возврата — обычный `UseQueryResult<Awaited<ReturnType>>`, то есть в компоненте работаете со стандартными `data / isPending / error / isSuccess`.

Использование — [PostsList.tsx](/Users/developer/projects/frontend-nextjs/src/features/posts-list/PostsList.tsx):

```tsx
const postsData = createDatasource(registry.postsDatasource);   // модульный уровень

export default function PostsList() {
  const { data: posts, isPending, error } = postsData.useGetPosts();
  ...
}
```

Смысл модульного уровня — React Compiler требует, чтобы ссылка на хук была стабильной между рендерами; объект хуков создаётся один раз при загрузке модуля.

### Записи — `createUsecase`

[utils/usecase.ts](/Users/developer/projects/frontend-nextjs/src/utils/usecase.ts) оборачивает любой объект с методом `execute(...args)` в `UseCaseWrapper` с единственным методом `.useMutation(opts?)`. Внутри — `useMutation`, где `mutationFn` разворачивает кортеж аргументов в `execute(...input)`.

Цепочка на примере создания поста — [usePostForm.ts](/Users/developer/projects/frontend-nextjs/src/features/post-management/hooks/usePostForm.ts):

```
createUsecase(new CreatePostCase(registry.postsDatasource))   // модульный уровень
  → .useMutation() внутри хука фичи
  → mutate([title, body], { onSuccess })
  → CreatePostCase.execute(title, body)
  → PostsDatasourceImpl.createPost({ title, body })
  → httpClient.post()
  → createModel(PostModel, response)   // Zod-валидация на границе
```

Вызывающий код всегда передаёт аргументы массивом: `deletePost([postId], { onSuccess })` — [DeletePost.tsx](/Users/developer/projects/frontend-nextjs/src/features/post-management/DeletePost.tsx), `updatePost([post.id, title, body], ...)`.

Сами use-cases тонкие — [CreatePostCase.ts](/Users/developer/projects/frontend-nextjs/src/domain/posts/usecases/CreatePostCase.ts) просто делегирует в датасорс. Обработка ошибок и маппинг в доменные модели живут в датасорсе — [PostsDatasourceImpl.ts](/Users/developer/projects/frontend-nextjs/src/data/posts/datasources/PostsDatasourceImpl.ts).

### Как выбирается обёртка

Критерий — **когда стреляет запрос**, а не чтение/запись. Автоматически на рендере → `createDatasource`. Императивно, по действию пользователя → `createUsecase`. Поэтому «ленивое» чтение по кнопке формально тоже должно быть use-case'ом. Подробности — [docs/agents/data-fetching.md](/Users/developer/projects/frontend-nextjs/docs/agents/data-fetching.md).

### Чего в этой схеме нет

- **Инвалидации кэша нигде нет.** Ни одного `invalidateQueries` / `useQueryClient` в проекте. После создания или удаления поста список не перезапрашивается — спасает только `staleTime: 0` при повторном монтировании. На реальном проекте это первое, что придётся добавить.
- **`QueryClient` — модульный синглтон.** `ApplicationProvider` помечен `'use client'`, но клиентские компоненты всё равно рендерятся на сервере при SSR, поэтому один кэш разделяется между запросами в процессе. Каноничное решение из доков React Query — создавать клиент в `useState`.
- **Ключ завязан на имя класса реализации.** Переименование `PostsDatasourceImpl` молча меняет все ключи; стоит проверить на продакшен-билде, что минификатор не мангает `constructor.name`.
- Нет серверного пути данных: из RSC эти хуки недоступны, prefetch/hydration не настроены.

---

## 3. Работа с UI-компонентами

### Тиры

Шесть уровней в [`src/ui/`](/Users/developer/projects/frontend-nextjs/src/ui), из них сейчас наполнены четыре:

| Тир                      | Что есть в репо                                                                                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `icons/`                 | 7 SVG, импортируются как React-компоненты через SVGR, с `currentColor` и без фиксированных размеров                                                                                         |
| `atoms/`                 | `button`, `ghost-button`, `icon-button`, `flex`, `spinner`, `text-field` (+`PhoneTextField`, `TextFieldMasked`), `typography` (`Heading`, `Content`, `But`, `Subscript`, `Message`, `Link`) |
| `molecules/`             | `form` (`Form`, `FormTextField`, `FormPhoneTextField`), `modal`, `confirm-dialog`                                                                                                           |
| `organisms/`, `layouts/` | пусто — заводятся, когда презентационная секция или каркас страницы реально переиспользуются                                                                                                |
| `transitions/`           | `Fade`, `Collapse` на Framer Motion, плоская папка без SCSS                                                                                                                                 |

Каждый компонент — своя папка `Component.tsx` + `Component.module.scss`. Исключения — `transitions/` и `icons/`, они плоские.

### Правила внутри `ui/`

- Никакой бизнес-логики: ни датасорсов, ни use-cases, ни MobX, ни знания о роутах. Зависимость только на `utils` (домен — в редких случаях с обоснованием).
- Пропсы описывают **внешний вид и поведение**, а не доменные сущности: `variant`, `size`, `loading`, `disabled` — да; `userId`, `orderStatus` — нет.
- Классы собираются через `clsx`, стили — только SCSS-модули, БЭМ-подобные имена (`button_variant_main`). Инлайн-стили под раскладку запрещены — вместо них атом `Flex` с пропсами `vertical`/`gap`.
- Типографика — это тоже атомы. [Button.tsx](/Users/developer/projects/frontend-nextjs/src/ui/atoms/button/Button.tsx) сам выбирает текстовый атом по размеру: `medium` → `But`, `small` → `Subscript`.
- `'use client'` ставится точечно. Атомы по возможности остаются серверными; директива висит на корнях фич.

Подробности — [docs/agents/ui.md](/Users/developer/projects/frontend-nextjs/docs/agents/ui.md), [docs/agents/styling.md](/Users/developer/projects/frontend-nextjs/docs/agents/styling.md), [docs/agents/icons.md](/Users/developer/projects/frontend-nextjs/docs/agents/icons.md).

### Оверлеи

Модалка презентационна и **не владеет своей видимостью**: принимает `open` и `onClose`, состояние держит тот, кто её рендерит. Фича строит контент поверх базового [Modal.tsx](/Users/developer/projects/frontend-nextjs/src/ui/molecules/modal/Modal.tsx) — [CreatePost.tsx](/Users/developer/projects/frontend-nextjs/src/features/post-management/CreatePost.tsx) кладёт в него заголовок и форму, а `open`/`onClose` получает пропсами от вью.

### Формы — цепочка из четырёх звеньев

1. **Атом** [TextField.tsx](/Users/developer/projects/frontend-nextjs/src/ui/atoms/text-field/TextField.tsx) — голый инпут, про react-hook-form не знает ничего.
2. **Молекула** [FormTextField.tsx](/Users/developer/projects/frontend-nextjs/src/ui/molecules/form/FormTextField.tsx) — единственное место, где вызываются `useFormContext` / `useController` / `useFormState`; подключает атом к форме по `name`, прокидывает `error` и `errorText`.
3. **Молекула** [Form.tsx](/Users/developer/projects/frontend-nextjs/src/ui/molecules/form/Form.tsx) — оборачивает в `FormProvider` и вешает `handleSubmit`, принимает `methods` и `onSubmit`.
4. **Фича** — хук с `useForm` + `zodResolver` и use-case'ами ([usePostForm.ts](/Users/developer/projects/frontend-nextjs/src/features/post-management/hooks/usePostForm.ts)), возвращающий `{ control, isPending, handleSubmit }`. Zod-схема формы живёт рядом с хуком. Один хук обслуживает и создание, и редактирование через параметр `mode`.

Важная граница: фичи и атомы **никогда** не трогают `useFormContext` — это привилегия form-молекул. Полные правила — [docs/agents/forms.md](/Users/developer/projects/frontend-nextjs/docs/agents/forms.md).

### Граница `ui/` и `features/*/ui/`

У фичи может быть свой сегмент `ui/` — и вот там бизнес-контекст допустим. [PostFormFields.tsx](/Users/developer/projects/frontend-nextjs/src/features/post-management/ui/PostFormFields.tsx) знает про `TPostForm` и конкретные поля, но собран целиком из `ui`-примитивов (`Form`, `FormTextField`, `Flex`, `Button`). Снаружи в этот сегмент ходить нельзя — ESLint разрешает импортировать только корень слайса; внутри самой фичи — можно. См. [docs/agents/structure.md](/Users/developer/projects/frontend-nextjs/docs/agents/structure.md).

### Композиция сверху вниз

```
app/(domain)/posts/page.tsx
  └─ PostsView            (views: заголовок, main, сетка)
       └─ PostsList       (feature: createDatasource, 'use client')
            └─ PostListItem   (features/posts-list/ui)
                 └─ Flex / Heading / Content / Button  (ui/atoms)
```

Импорты везде через алиасы (`@ui`, `@features`, `@domain`, …), относительные пути с `../../` запрещены.

---

## 4. Наблюдения и риски

Каркас узнаваемо чистоархитектурный и последовательный, правила зафиксированы в ESLint. Ниже — места, где он отходит от канона или содержит реальные проблемы, по убыванию важности.

**Чинить сейчас:**

1. **Серверное хранилище cookies — процессный синглтон с мутацией.** [createServerCookieStorage.ts](/Users/developer/projects/frontend-nextjs/src/application/di/server-cookies-storage/createServerCookieStorage.ts) возвращает один объект на процесс, а [bindServerRequestCookies.ts](/Users/developer/projects/frontend-nextjs/src/application/di/bindServerRequestCookies.ts) записывает в него cookies текущего запроса. `React.cache()` дедуплицирует вызов внутри одного запроса, но не изолирует сам объект между запросами: при параллельных запросах в одном Node-процессе они перетирают друг другу привязанный cookie-store. Решение — `AsyncLocalStorage` или явная передача store.
2. **Ключи кэша от имени класса реализации** — деталь data-слоя протекает в идентичность кэша; плюс риск мангла имён в проде.
3. **Отсутствие инвалидации** после мутаций (см. раздел 2).

**Архитектурные развилки, которые стоит разрешить до того, как на шаблон сядут проекты:**

4. **Чтения проходят мимо домена.** Мутации идут через use-cases, запросы — напрямую из фичи в датасорс. Use-case обязателен только для записи.
5. **Это не DI, а service locator.** Зависимости не видны в сигнатуре компонента, отсутствие регистрации падает в рантайме (`DependencyNotRegisteredError`). Модуль реестра при импорте выполняет побочный эффект — порядок импортов значим, изоляция в тестах усложнена.
6. **Архитектура клиентская при серверной декларации.** Правило «по умолчанию RSC» соседствует с тем, что весь доступ к данным клиентский, а `AuthorizationWrapper` стоит клиентским компонентом близко к корню. По факту это SPA внутри App Router.
7. **Авторизация — не граница безопасности.** Редирект делается в `useEffect` после чтения cookies; это UX-механика, а не защита. Проверка должна жить в middleware или на сервере.

**Осознанная плата за переносимость подхода:**

8. **Домен зависит от Zod** — модели ядра объявлены через схемы валидации, то есть внутренний слой знает о библиотеке разбора внешних данных. Прагматично, но чистым ядро назвать нельзя.
9. **«8 слоёв» — это не 8 слоёв.** Domain, Data, Application — архитектурные кольца; Utils, UI, Errors — папки по типу файлов. Правило «все слои могут обращаться к Application» противоречит однонаправленности (точнее: Application — composition root, так и стоит сформулировать).
10. **Три уровня композиции там, где Next даёт один:** `page.tsx` → view → feature. Окупается на больших экранах, на маленьких — церемония.
11. **Домен анемичный.** Пять use-case'ов, из них три — сквозной CRUD. Для базового шаблона нормально: цена абстракции уплачена, выгода начнёт возвращаться с появлением настоящих бизнес-правил.
