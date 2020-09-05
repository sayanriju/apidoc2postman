#! /usr/bin/env node
const API_DATA_FILE = "/home/sayan/Code/WORK/bookguruservice/public/docs/api_data.json"
const PROJECT_DATA_FILE = "/home/sayan/Code/WORK/bookguruservice/public/docs/api_project.json"
const { readFileSync } = require("fs")
const { capitalCase, snakeCase } = require("change-case");
const cuid = require("cuid")
const { Collection, Item, Request } = require("postman-collection")

// const { bodyBuilder, headerBuilder } = require("../lib")

const { name: projectName, description: projectDescription } = JSON.parse(readFileSync(PROJECT_DATA_FILE));

function bodyBuilder(data) {
  if (data.parameter === undefined) return
  const blankVals = {
    "string": "",
    "number": 1,
    "string[]": [],
    "number[]": [],
    "object": {},
    "boolean": true,
    "bool": true
  }
  const bodyObj = data.parameter.fields.Parameter
    .filter(el => el.group === "Parameter")
    .reduce((acc, cur) => {
      acc[cur.field] = cur.defaultValue || blankVals[cur.type.toLowerCase()]
      return acc
    }, {})
  return JSON.stringify(bodyObj, null, 2)
}

function headerBuilder(data) {
  if (data.header === undefined) return [{
    key: "Content-Type",
    value: "application/json"
  }]
  const headerArr = data.header.fields.Header
    .filter(el => el.group === "Header" && el.field)
    .map(el => ({
      key: el.field,
      value: el.defaultValue || (el.field.toLowerCase() === "authorization")
        ? "Bearer {{jwt}}"
        : ""
    }))
  return [...headerArr, {
    key: "Content-Type",
    value: "application/json"
  }]
}

const apiData = JSON.parse(readFileSync(API_DATA_FILE))
  .filter(item => ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(item.type.toUpperCase()))

const folders = [... new Set(apiData.map(item => item.group))]


const postmanCollection = new Collection({
  "info": {
    name: capitalCase(projectName), description: projectDescription || projectName
  },
  "item": folders.map(folder => ({
    id: (folder),
    name: capitalCase(folder),
    item: []
  }))
})

// console.log(apiData.map(e => JSON.stringify(e.header, null, 2)));

apiData.forEach(el => postmanCollection.items.one(el.group).items.add(new Item({
  "name": capitalCase(el.name),
  "id": el.name,
  "request": {
      "description": el.title,
      "url": `{{apiRoot}}${el.url}`,
      "method": el.type.toUpperCase(),
      "header": headerBuilder(el),
      "body": { mode: "raw", raw: bodyBuilder(el) }
  }
})))

postmanCollection.variables.add({
  id: "jwt",
  value: "XX.YYY.ZZZZZ",
  type: "string"
})
postmanCollection.variables.add({
  id: "apiRoot",
  value: "http://localhost:3000",
  type: "string"
})

console.log(JSON.stringify(postmanCollection, null, 2))