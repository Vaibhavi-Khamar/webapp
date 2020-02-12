# webapp
##Bill Tracking application:

This is a node js application with MySQL, Express, and Sequelize: Node and Sequelize to query and route data in the app

It needs a container to be deployed.

Modules has to be downloaded for compilation of the application using 
```bash
npm install
```

Root of the endpoint will be webapp.

##Starting App:

```bash
npm start
```
This will start the application and create a mysql database in your app dir.

##Unit Test:

Added some Mocha based test. Run them using
```bash
npm test
``` 

pr_check job of circleCI will be triggered when creating a pull request & build_deploy job will be triggered after merging PR.