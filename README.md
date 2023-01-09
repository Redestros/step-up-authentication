# Step-up Authentication

Ever wondered how banking apps require additional challenge when we make a sensitive operation like transferring money ? This practice of requiring additional levels of authentication is not limited to financial apps, in fact it has become popular nowadays and it is called **Step-up Authentication.**

This repo is a demonstration of this process using Keycloak as Identity provider and Angular for developing the relaying party.

I created a custom authentication flow in keycloak in which I configured different steps for different levels of authentication (in our case we have normal and transfer levels)

To run the app you must first go to keycloak-angular directory and run the following commands:

```sh
npm install keycloak-angular keycloak-js
npm run showcase
```

This angular app used for demonstration is based on this [gihtub repo](https://github.com/mauriciovigolo/keycloak-angular#installation) 