# GIT WORKFLOW FOR RECORD/REPLAY


__*3 RESTRICTED TYPES OF BRANCH*__

**MASTER** - ACCESS RESTRICTED, all minified and unminified code, infinite lifetime, reflects a "__production-ready state__"

**HOTFIX** - ACCESS RESTRICTED, quickly fix production bugs, all minified and unminified code, always __limited life time__

**PRODUCTION** - ACCESS RESTRICTED, minified code, infinite lifetime

__*2+ OPEN BRANCHES*__

**DEVELOP** BRANCH, all minified and unminified code, infinite lifetime, latest delivered development changes for the next release, an "__integration branch__" for all developers

**RELEASE** BRANCH, all minified and unminified code, develop new features for the upcoming or a distant future release, always __limited life time__

**FEATURE** BRANCHES, all minified and unminified code, always __limited life time__

__*APPROACH*__

BASIC RULE - AS LITTLE CODING AS POSSIBLE on the DEVELOP BRANCH - ALWAYS ADD A FEATURE BRANCH WHEN MAKING CHANGES TO CODE BASE - can just be your name and a date

ALL FEATURE BRANCHES are merged back into develop (to definitely add the new feature to the upcoming release) or discarded __$ git branch -d myfeature__

# MAKING THE DEVELOP BRANCH

Must branch off from : __master__

Must merge back into: __master__

Branch naming convention: develop

To set up the develop branch for the first time, switch the repo to the master branch, pull the latest commits from master and reset the repo's local copy of master to match the latest version. 

__$ git checkout master__, __$ git fetch origin__, __$ git reset --hard origin/master__

Then create the new develop branch locally and push it to the server

__$ git branch develop__, __$ git push -u origin develop__

To update master with changes from develop

__$ git checkout master__, __$ git merge develop__

# MAKING A FEATURE BRANCH

May branch off from: __develop__

Must merge back into: __develop__

Branch naming convention: anything except master, develop, release-\*, hotfix-\* or production


Creating a feature branch: __$ git checkout -b myfeature develop__

Saving your work on a feature branch: __$ git add -A__, __$ git commit -m "some piece of work"__, then to save it remotely so others can see it __$ git push -u origin myfeature__

Incorporating a finished feature on develop: __$ git checkout develop__, __$ git merge --no-ff myfeature__, __$ git branch -d myfeature__, __$ git push origin develop__

The --no-ff flag causes the merge to always create a new commit object, even if the merge could be performed with a fast-forward. This avoids losing information about the historical existence of a feature branch

If the develop branch has been changed since you checked it out, you can also incorporate the third party changes using __$ git pull --rebase origin develop__

# MAKING A RELEASE BRANCH

May branch off from: __develop__

Must merge back into: __develop__ and __master__

Branch naming convention: release-*


The key moment to branch off a new release branch from develop is when develop (almost) reflects the desired state of the new release. 

It is exactly at the start of a release branch that the upcoming release gets assigned a version number � not any earlier. So this is when the manifest version number is changed

Creating a release branch: __$ git checkout -b release-1.2 develop__, then make the changes to the manifest etc., then __$ git commit -a -m "Bumped version number to 1.2"__

Once the release branch has been created, bug fixes may be applied in this branch (rather than on the develop branch). Adding large new features here is strictly prohibited.


Finishing a release branch: __MASTER__ FIRST: __$ git checkout master__, __$ git merge --no-ff release-1.2__, __$ git tag -a 1.2__

Finishing a release branch: __DEVELOP__ SECOND: __$ git checkout develop__, __$ git merge --no-ff release-1.2__, which will lead to merge conflict as we have changed the manifest version number. fix it and commit, then delete the branch __$ git branch -d release-1.2__

# MAKING A HOTFIX BRANCH

May branch off from: __master__

Must merge back into: __develop__ and __master__

Branch naming convention: hotfix-*


The essence is that work of team members (on the develop branch) can continue, while another person is preparing a quick production fix.


Creating the hotfix branch: __$ git checkout -b hotfix-1.2.1 master__, don't forget to bump the version number after branching off!, __$ git commit -a -m "Bumped version number to 1.2.1"__, then fix the production bug as quickly as we can, __git commit -m "Fixed severe production problem"__

Finishing a hotfix branch: __MASTER__ FIRST: __$ git checkout master__, __$ git merge --no-ff hotfix-1.2.1__, __$ git tag -a 1.2.1__

Finishing a hotfix branch: __DEVELOP__ SECOND: __$ git checkout develop__, __$ git merge --no-ff hotfix-1.2.1__, then delete the branch __$ git branch -d hotfix-1.2.1__

The one exception to the rule here is that, when a release branch currently exists, the hotfix changes need to be merged into that release branch, instead of develop. 

# MAKING A PRODUCTION BRANCH

Must branch off from: __master__

Branch naming convention: __production__

Preparing the production branch, __$ git checkout master__, then make all the changes according to the list

Checklist for production ready changes to extension

1) Change all manifest.json background scripts references to minified versions
2) Make sure index.html user interface references minified javascript files
3) Make sure active recording and replay models refer to minified javascript files
4) Delete all the non-minified scripts from models, recordingScripts, replayingScripts, utils folders
5) Delete all the non-minified scripts from background folder
6) Delete all the non-minified user interface scripts
7) Test all functionality!

The essence here is that the production version should be as lean as possible, so only minified code and no comments

then __$ git push origin production__
