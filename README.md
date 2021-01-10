# contest-creator

Aplikacja realizowana we framework'u LoopBack.

## Baza danych

Aplikacja tworzy bazę danych oraz zajmuje się dodawaniem, usuwaniem, edytowaniem encji i rekordów w niej zawartych.

KONIECZNE jest stworzenie bazy postgreSQL lokalnie.

W naszym wypadku dane dostępowe do niej znajdują

```
src\datasources\db.datasource.dev.json
```

Żeby uruchomić aplikację należy stworzyć bazę danych z takim dostępem lub odpowiednio zedytować ten plik.

Powinno wystarczyć zmienienie `user`, `password` oraz `database`.

Przy pierwszym uruchomieniu aplikacji (za pomocą "npm run debug-postgresql") można zobaczyc skrypty tworzące tabele:

```sql
CREATE TABLE "dev"."commission" (
"id" SERIAL,
"contest_id" INTEGER,
"user_id" INTEGER,
PRIMARY KEY("id")
)

SQL: CREATE TABLE "dev"."contest" (
"id" SERIAL,
"title" TEXT NOT NULL,
"created_at" TIMESTAMP WITH TIME ZONE,
"starting_at" TIMESTAMP WITH TIME ZONE NOT NULL,
"ending_at" TIMESTAMP WITH TIME ZONE NOT NULL,
"user_id" INTEGER,
"secret" TEXT,
PRIMARY KEY("id")
)

SQL: CREATE TABLE "dev"."mark" (
"id" SERIAL,
"solution_id" INTEGER,
"user_id" INTEGER,
"mark_comment" TEXT NOT NULL,
"mark_value" INTEGER NOT NULL,
PRIMARY KEY("id")
)

CREATE TABLE "dev"."participation" (
"id" SERIAL,
"contest_id" INTEGER,
"user_id" INTEGER,
PRIMARY KEY("id")
)

CREATE TABLE "dev"."task" (
"id" SERIAL,
"contest_id" INTEGER,
"task_text" TEXT NOT NULL,
PRIMARY KEY("id")
)

CREATE TABLE "dev"."user" (
"id" SERIAL,
"firebase_uid" TEXT NOT NULL,
"display_name" TEXT NOT NULL,
"email" TEXT NOT NULL,
"access_level" SERIAL,
PRIMARY KEY("id","firebase_uid","email")
)

CREATE TABLE "dev"."solution" (
"id" SERIAL,
"task_id" INTEGER,
"user_id" INTEGER,
"solution_text" TEXT NOT NULL,
PRIMARY KEY("id")
)
```

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

W wypadku jakichkolwiek pytań proszę od razu napisać na:

```
mr418395@students.uw.edu.pl
```

lub zadzwonić na:

```
698813776
```

nie zważając na porę dnia i nocy.
