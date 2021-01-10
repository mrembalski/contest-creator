# contest-creator

Aplikacja realizowana we framework'u LoopBack.

## Baza danych

Aplikacja tworzy bazę danych oraz zajmuje się dodawaniem, usuwaniem, edytowaniem encji i rekordów w niej zawartych.

KONIECZNE jest stworzenie bazy postgreSQL lokalnie. W naszym wypadku dane dostępowe do niej znajdują "src\datasources\db.datasource.dev.json" - należy albo stworzyć bazę danych z takim dostępem lub odpowiednio zedytować ten plik. Powinno wystarczyć zmienienie user, password oraz database.

## Instalowanie koniecznych bibliotek

Do uruchomienia aplikacji konieczny jest NodeJS oraz npm. NodeJS można pobrać z https://nodejs.org/en/download/, a razem z nim powinien zostać zainstalowany npm.

Ponadto, aplikacja korzysta z dodatkowych bibliotek, które trzeba zainstalować komendą:

```sh
npm install
```

## Uruchomienie

Aplikację można uruchomić za pomocą:

```sh
npm start
```

W terminalu, w którym została uruchomiona powinien być komunikat do utworzenia konkretnego linku z konkretnym portem - na nim został uruchomiony serwer.

If `eslint` and `prettier` are enabled for this project, you can use the
following commands to check code style and formatting issues.

```sh
npm run lint
```

To automatically fix such issues:

```sh
npm run lint:fix
```

## Other useful commands

- `npm run migrate`: Migrate database schemas for models
- `npm run openapi-spec`: Generate OpenAPI spec into a file
- `npm run docker:build`: Build a Docker image for this application
- `npm run docker:run`: Run this application inside a Docker container

## Tests

```sh
npm test
```

## What's next

Please check out [LoopBack 4 documentation](https://loopback.io/doc/en/lb4/) to
understand how you can continue to add features to this application.

[![LoopBack](<https://github.com/strongloop/loopback-next/raw/master/docs/site/imgs/branding/Powered-by-LoopBack-Badge-(blue)-@2x.png>)](http://loopback.io/)
