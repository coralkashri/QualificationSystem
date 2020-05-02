# Qualification System
**Design & Apply your road map**<br>
Web-based application of qualification system for new team members.

# Description
An interactive web-based application to design a road map for new team members / general qualification
(see [developers road map](https://github.com/kamranahmedse/developer-roadmap)). Create plans, topics, and tasks,
and apply different topics and unique topics order for each plan.

**Compatible with offline systems.**

# Qualification System Demo
[Qualification System Demo](https://qualification-plan-demo.herokuapp.com/)

# Dependencies
* [node.js](https://nodejs.org/en/).
* [mongodb](https://www.mongodb.com/).

# Run
```
sudo service mongod start # make sure to start mongodb service
node ./app.js
```

## Access Server
```
# On browser [chrome recommended]: localhost:5000
```

## Configuration
At the first time you run the system, admin user is automatically generated.
```
username: admin
password: admin
```
You can modify this user after login into it using ```Sidebar -> Admin Panel -> Users Management -> admin```

WARNING! Don't lose your admin user credentials.

# Stabled Features
* Users & Plans & Topics & Tasks management.
* Task features:
    * Title
    * Topic Mapping
    * Details / Question section
    * Related Files (Upload files to server, and display most of them in browser - pdf, ppt, mp3, mp4, code files, etc.. using [ViewerJS](http://github.com/kogmbh/ViewerJS)).
    * Custom Code Sections (using [ace.js](https://github.com/ajaxorg/ace)).
    * Hints
    * Judgement Criteria
    * Answer type:
        * Auto Check Answers:
            * TEXT_STRONG - Password/CTF
            * TEXT_SOFT - Regex checking
            * BOOLEAN - Multiple options - Single choice
            * MULTIPLE_CHOICES - Multiple options - Multiple choice
        * Human Check Answers:
            * Free Text
            * Custom Files
* Register to plans.
* Tasks submission.
* Auto answers check.
* Archive/Reactivate plans.
* Topics dependencies (If a specific topic selected to plan, all of it's dependencies have to be selected too, and to be ordered before it).
* Circular dependencies validation.
* Users privileges:
    * Admin & Manager   -> Create/Modify/Remove/Archive Users & Plans & Topics & Tasks.
    * User              -> Register to plans, submit tasks, profile editing.
    * Banned            -> No access at all.
* Admin Panel:
    * Users control panel (Add / Modify / Remove).
    * Plans control panel (Add / Modify / Remove / Archive / Reactivate).
    * Topics control panel (Add / Modify / Remove / Archive / Reactivate).
    * Tasks control panel (Add / Modify / Remove).
* Easy to use web-based interface, designed with [MaterializeCSS](https://materializecss.com/)
* Compatible with offline systems.
* Cross-Platform application.
* Responsive to Phones & Tablets & PC.

# TODO
* Some validations.
* Task features:
    * Answer type:
        * Auto Check Answers:
            * COMPILATION_RESULT
* Archive/Reactivate topics.
* View tasks in review.
* View failed tasks.
* View completed tasks.
* Submit review for tasks.