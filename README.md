# Base Code

## Getting Started

Install dependencies

```bash
npm ci
```

## Development

1. Run development server `npm run dev`
2. Open [http://localhost:3000](http://localhost:3000) in your browser

## GitLab CLI (`glab`)

The `/ship` and `/opsx:ship` agent commands open merge requests through [`glab`](https://gitlab.com/gitlab-org/cli). Install and authenticate once:

```bash
brew install glab
glab auth login --hostname git.redmadrobot.com
```

Without `glab`, commits and pushes still work — only the merge request has to be opened by hand.

> Both commands target `master` by default. On a real project switch that default to `dev` in `.claude/commands/ship.md` and `.claude/commands/opsx/ship.md`, or pass `--target dev` per run.

## Работа с токенами

1. Данный базовый код поддерживает работу с токенами, хранящимися как в серверных, так и клиентских cookies.
2. Хранение, запись и обновление токена происходит в `TokenManagerImpl.ts`, получение для проверки авторизационных прав — в `AuthorizationWrapper.tsx`.
3. На проекте нужно выбрать один из подходов и актуализировать `TokenManagerImpl.ts` и `AuthorizationWrapper.tsx`.
   1. Если выбран подход с серверными cookies, из `TokenManagerImpl.ts` нужно убрать хранение и запись токена, и в `AuthorizationWrapper.tsx` сделать завязку только на серверные cookies.
   2. Если выбран подход с клиентскими cookies, то из `AuthorizationWrapper.tsx` нужно убрать завязку на серверные cookies.
