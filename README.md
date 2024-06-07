# Description

This repository contains a suite of three microservices built with NodeJS:

API-Gateway
AuthService
UserService
Features:

Authentication: Supports two types of authentication mechanisms:
Local Authentication: Using username and password.
LDAP Authentication: Domain-based authentication via Active Directory.
Authorization: Role-based and action-based authorization mechanisms.
This architecture provides a robust framework for secure and scalable service management, combining modern authentication practices with flexible authorization controls.

## Requirements: 

MongoDB Replica Set
See: https://github.com/BohdanVovkotrub/mongo-replicaset-docker 

## Setup

1. clone whis repo
2. in each service add ```.env``` file, and setup it as example ```.env.example```
3. To download NPM dependencies run ```npm install``` in each service. That's will download ```node_modules```
4. To run service go the service's folder and run ```npm run start```
