# WHAT DOES RECORD/REPLAY DO?

Record/Replay lets you run end-to-end functional tests on your web site / application.

As you develop, and definitely before you deploy to production, you want to know that all the key functionality really works.

You don’t want your users to find the bugs before you do — your users will not stick around for long if that happens.

Our automated tests give you this quick feedback on whether your application has broken after making changes to the existing code base. 

As our tests are performed on the actual website, Record/Replay works no matter how you develop your site, be it React, Angular, Vue or some other framework.

Tests run in your Chrome browser and all testing info is saved locally in storage, with the option to export and import saved info. 

We aim to serve all website developers, from those with no programming experience to those with experience of multiple testing frameworks. 

# HOW DOES RECORD/REPLAY WORK? 

__RECORD__ - Listens for all user interface interactions through keyboard and mouse, including steps required for key functionality, such as signup, login, add purchase to cart etc.

__REPLAY__ - Simulates all recorded user interface interactions (clicking, typing, scrolling etc.), ensuring that these scenarios actually work from the point of view of an end user.

__REPORT__ - Provides feedback on the execution of user interface interactions, including detailed logging of user interface interaction fails and visual regression analysis of screenshots.

# WHY SHOULD YOU INSTALL RECORD/REPLAY?

Manual end-to-end functionality testing is time-consuming and tedious. 
Record/Replay delivers easy automation testing to everyone, __speeding up delivery of production code__ you can trust.
This allows the continuous delivery process to run smoothly at your organization with a quality selection of functional tests.

Beginners benefit from Record/Replay being ready-to-go as installed. __No coding skills are required to record and to replay tests__. 
Everything you need to start functional testing is included as part of the intuitive user interface.
You can also gain an introductiont to different testing frameworks by using our code export functions.

Experienced testers can use Record/Replay to __generate short, unique selectors for all element targets__, using our built-in CSS and Xpath selector generators.
In addition, our code generators produce code for Jest, Puppeteer, Cypress and Selenium Webdriver that you can copy and paste into your testing suites.
This can reduce the amount of time taken to create a full-coverage functional testing suite suitable for multiple different browsers, on your machine or in the cloud.

# WHY IS IT BETTER THAN OTHER TESTING FRAMEWORKS?

Record/Replay is __free and open-source__, which distinguishes it from many other frameworks.
In addition, Record/Replay requires __zero configuration__. High set-up costs can act as a barrier to setting up proper testing.
You can start testing your site in minutes, with no previous experience of Record/Replay or even testing websites in general.

Beginners?

1. No special installation or setup required, no testing expertise or even programming skills required, no third party plugins, no dependent libraries, it just works.

Experts?

If you have wide experience of existing testing frameworks, you know that automated functional testing can be a tricky process to configure and to maintain. 
Compared to Puppeteer, Record/Replay benefits from using the Chrome browser itself, rather than the headless version, and supports extensions like Flash.
Compared to Cypress, Record/Replay supports the use of the tab key in user interface testing, allows bandwidth / latency throttling and supports iframe interaction by default.
Compared to Selenium Webdriver, Record/Replay is less flaky (prone to erroneous fails), faster to complete tests and provides better reporting.








vs Selenium webdriver



It’s much faster than Selenium and avoids a lot of the messy configuration and flakiness that comes with trying to launch a real browser. 
No steps in the beginning asking you to download specific versions of the selenium server jar, geckodriver, chromedriver etc which is both fiddly and error prone. 
DOCUMENTATION IS AWFUL!!!

One really awesome thing about testcafe is that it automatically detects JS errors that happened when the test page was executing. I suppose this is the kind of awesome you can 
attain when you reach outside of the Selenium box! I also noted that the terminal output when tests failed where quite readable/clean.


Who is non-code web-service-based automated testing best for?
Startup founders like my friend Matt, who want to save the time they normally have to spend before/after a production deploy to avoid hearing embarrassing support issues day later. 🙇
Sites that change infrequently. Teams which manually deploy their code (whether via a git push heroku master, cap production deploy, or `ssh my-production-server` and `rsync`). 💪
Websites where some breakage is OK 💁, and not catastrophic. Marketing sites, blogs—sites without a “Buy Now” button and shopping cart flow. A bug on production 
might distract one person for an hour or two, but won’t block content creators or folks depending on your service to complete their daily tasks