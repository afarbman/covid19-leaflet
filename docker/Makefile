#
# This makefile's purpose is help starting angular 10 projects.
# it starts off with a simple rest API that fetches some stocks and displays it on a table
# it uses angular material
#
# TARGETS:
#
#	build:
#	run:

# Force using bash for recipes
SHELL := $(shell which bash)

# Path to the current makefile
SELF := $(lastword ${MAKEFILE_LIST})

.DEFAULT_GOAL := help
help:
	@sed -n '1,/^$$/p' ${SELF} | sed 's/^# \?//'


build:
	docker build -t node14 .

run: build
	docker run -it -v "${PWD}"/..:/home/node/app/ --rm --name covid-map -p 3000:3000 node14:latest

debug: build
	docker run -it -v "${PWD}"/..:/home/node/app/ --rm --name covid-map -p 3000:3000 node14:latest bash