# Step-up Authentication

Ever wondered how banking apps require additional challenge when we make a sensitive operation like transferring money ? This practice of requiring additional levels of authentication is not limited to financial apps, in fact it has become popular nowadays and it is called **Step-up Authentication.**

This repo is a demonstration of this process using Keycloak as Identity provider, Angular for developing the relaying party and Dotnet for developing the resource server.

You can read more about this project in this [article](https://medium.com/@ahmedmohamedelahmar/step-up-authentication-with-keycloak-9906ba819964)

## Run and configure keycloak

First go to config folder and type

```sh
docker-compose up -d
```

This will start Keycloak 26.8.0 (backed by PostgreSQL 16) exposed on the local port 8080. Once it's up and ready, run the script to create terraform client in keycloak

```sh
./create-terraform-client.sh
```

We will use then terraform to setup new realm, client, user, custom authentication flow, acr/loa mapping etc...

Once you got terraform installed, type the following commands:

```sh
terraform init
terraform apply
```
You will be prompted to enter a value, so type yes then press enter. That's it you got keycloak up and configured

### Upgrading an existing local setup

- **Terraform provider**: the config now uses the [keycloak/keycloak](https://registry.terraform.io/providers/keycloak/keycloak/latest) provider (the project that took over `mrparkers/keycloak`). If you already applied this config with the old provider, migrate your existing state before running `terraform apply`:

```sh
terraform state replace-provider registry.terraform.io/mrparkers/keycloak registry.terraform.io/keycloak/keycloak
terraform init -upgrade
```

- **PostgreSQL data**: Keycloak 26.8 requires PostgreSQL 14 or newer. A `postgres_data` volume created by an older PostgreSQL (e.g. 12) can't be opened by the PostgreSQL 16 container. Everything in this demo is recreated by the steps above, so the simplest fix is to start from a fresh volume with `docker-compose down -v` (this deletes the Keycloak data in that volume).

## Run the resource server

The transfer service targets .NET 10, so you need the [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0). Go to the TransferService directory and run:

```sh
dotnet dev-certs https --trust
dotnet run --launch-profile https
```

The API listens on `https://localhost:7050` (the Angular app calls this address), and Swagger is available at `/swagger` in the Development environment.

## Run the application

The app is built with Angular 21, which needs Node.js `^20.19`, `^22.12` or `>=24`. Go to the keycloak-angular directory and run the following commands:

```sh
npm install
npm run showcase:example
```

This angular app used for demonstration is based on this [gihtub repo](https://github.com/mauriciovigolo/keycloak-angular#installation) 