# Elephant Carpaccio - a Nano-incremental development exercise
## Introduction
Incremental development is an important habit of the Agile Mindset.

[Alistair Cockburn](https://en.wikipedia.org/wiki/Alistair_Cockburn) created the [Elephant Carpaccio Exercise](http://alistair.cockburn.us/Elephant+Carpaccio+Exercise) to help coders and product owners get into the mood.

## The Situation
To enter the exercise imaging the following context.

A small startup is in the business of selling meat online. So far, they purchased a web application allowing customers to select a product and a quantity to purchase, **The Store**.

The founders' business plan foresees to roll out the application to several states in the US. All they need is a service able to calculate taxes depending on the state of delivery, **The Pricing Engine**. They will hire a contractor to deliver that service.

This is where the exercise begins, participating teams play the role of those contractors. The startup is short on budget, you better help them earn money quickly ...

We are aiming for a _Self-funding project_. Slicing the problem in thin vertical slices to laminate the solution is the approach agile organizations take, it allows for [Design by Knowledge Acquisition](http://alistair.cockburn.us/Design+as+Knowledge+Acquisition) and [Disciplined Learning](http://alistair.cockburn.us/Disciplined+Learning).

## The Store
- This repository implements the store part of the exercise.
- It displays a list of products that customers can buy.
- A customer can pick a product, a quantity and select their state of residency.
- When the form is submitted, the transaction is sent to all registered pricing engines and their results displayed.

## The Pricing Engine
- Each team taking part into the exercise can register their pricing engine
- using the "Register" button on the store homepage.
- Pricing engine implementations must be accessible by the store - if all runs on the Internet, you're done.
- and must adhere to the specification of the pricing engine.
- There is no constraint in the language used to implement the pricing engine.
- Empty implementations are provided as starter packages for:
  - [NodeJS](https://github.com/l2fprod/carpaccio-pricing)

## Deploying the store on Bluemix
[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy?repository=https://github.com/l2fprod/carpaccio-store)

Using this button, you can get your own store deployed to Bluemix very quickly. If you'd like to get your own copy of the code locally and deploy from your machine, follow the next steps.

## Running the store on Bluemix
- Create a Bluemix Account

   [Sign up][bluemix_signup_url] for Bluemix, or use an existing account.

- Download and install the [Cloud-foundry CLI][cloud_foundry_url] tool
- Clone the app to your local environment from your terminal using the following command

  ```
  git clone https://github.com/l2fprod/carpaccio-store.git
  ```

- cd into this newly created directory
- Edit the `manifest.yml` file and change the `<application-name>` and `<application-host>` from `carpaccio-store` to something unique.

  ```
   applications:
   - name: carpaccio-store
     host: carpaccio-store
     memory: 256M
  ```

  The host you use will determinate your application url initially, e.g. `<application-host>.mybluemix.net`.

- Connect to Bluemix in the command line tool and follow the prompts to log in.

  ```
   $ cf api https://api.ng.bluemix.net
   $ cf login
  ```

- Push the application to Bluemix.

  ```
  $ cf push
  ```

And voila! You now have your very own instance running on Bluemix. Navigate to the application url, e.g. `<application-host>.mybluemix.net`.

### Troubleshooting
To troubleshoot your Bluemix app the main useful source of information is the logs. To see them, run:

```sh
  $ cf logs <application-name> --recent
```

--------------------------------------------------------------------------------

This sample application is created for the purpose of supporting the exercise. The program is provided as-is with no warranties of any kind, express or implied.

[bluemix_signup_url]: https://console.ng.bluemix.net/?cm_mmc=GitHubReadMe-_-BluemixSampleApp-_-Node-_-Workflow
[cloud_foundry_url]: https://github.com/cloudfoundry/cli
