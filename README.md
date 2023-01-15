# Step-up Authentication

Ever wondered how banking apps require additional challenge when we make a sensitive operation like transferring money ? This practice of requiring additional levels of authentication is not limited to financial apps, in fact it has become popular nowadays and it is called **Step-up Authentication.**

This repo is a demonstration of this process using Keycloak as Identity provider and Angular for developing the relaying party.

I created a custom authentication flow in keycloak in which I configured different steps for different levels of authentication (in our case we have normal and transfer levels)

## Run and configure keycloak

First go to config folder and type

```sh
docker-compose up -d
```

This will start a keycloak container exposed on the local port 8080. Once it's up and ready, run the script to create terraform client in keycloak

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

## Run the application

To run the app you must go to keycloak-angular directory and run the following commands:

```sh
npm install keycloak-angular keycloak-js
npm run showcase:example
```

This angular app used for demonstration is based on this [gihtub repo](https://github.com/mauriciovigolo/keycloak-angular#installation) 