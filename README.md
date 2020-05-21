## What for

Manage product doc files system, especially when multi language file is maintained. Good to use with [Gatsby](https://www.gatsbyjs.org/) or other markdown to html generater. **Especially easy to use for Non-technical User.**

## Features

- Auto update file | directory in **/site** when origin file | directory is add | change | delete in **/src**;
- varible is supported;
- fragment is supported;
- varible in fragment is supported;
- markdown to html is supported;
  ex{{var.title}}.
- ignore is configurable. ignore file | directory is filtered when generater target file | directory;

## Environment Requirement

[node](https://nodejs.org/zh-cn/download/)

## Getting started

Install with git or [click to download zip](https://github.com/talentAN/markdown2markdown/archive/master.zip)

`git clone git@github.com:talentAN/markdown2markdown.git`

start watcher

`yarn start`

## Examples

1. use variables;

```javascript
// origin(src/test.md):
### This is {{var.name}};

// variableFile(src/variables.json)
{"name":"Tom"}

// will turn to target(site/test.md)
### This is Tom;
```

2. use fragment and variables;

```javascript
// origin(src/test.md):
### This is {{var.name}};
{{fragment/card.md}}
{{fragment/warn.md}}

// variableFile (src/variables.json)
{"name":"Tom", "info":{ "phone":"1234567", "email":"xxx@gmail.com"}}

// fragmentFile (src/fragment/card.json)
###### name:{{var.name}}
###### email:{{var.email}}

// fragmentFile (src/fragment/warn.json)
###### the info should keep confidential

// will turn to target(site/test.md)
### This is Tom ;
###### name:Tom
###### email:xxx@gmail.com
###### the info should keep confidential
```

3. use multilayer variables

```javascript
// origin(src/user/info.md):
### This is {{var.name}};
{{fragment/card.md}}
{{fragment/warn.md}}

// variableFile (src/variables.json)
{"name":"Tom", "info":{"phone":"1234567", "email":"xxx@gmail.com"}}

// variableFile (src/user/variables.json)
{"name":"Alex", "info":{"phone":"9876543"}}

// fragmentFile (src/fragment/card.json)
###### name:{{var.name}}
###### email:{{var.email}}

// fragmentFile (src/fragment/warn.json)
###### the info should keep confidential

// will turn to target(site/test.md)
### This is Alex;
###### name:Alex
###### email:xxx@gmail.com
###### the info should keep confidential
```
