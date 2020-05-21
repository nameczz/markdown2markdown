const process = require("process");
const fs = require("fs");
const merge = require("lodash/merge");
const {
  name_dir_from,
  name_file_variable,
  name_dir_fragment
} = require("../Consts");
const { getTargetPath, getChildrenPath } = require("./Path");
const path_dir_root = process.cwd();

const _isDirectory = path_abs => fs.lstatSync(path_abs).isDirectory();
const parseJsonFile = path_abs => {
  return JSON.parse(fs.readFileSync(path_abs).toString() || "{}");
};
const _getVariable = path_abs => {
  let res = {};
  const paths_child = path_abs.split(path_dir_root + "/")[1].split("/");
  //   console.log(paths_child);
  let path_pre = path_dir_root;
  let i = 0;
  while (i < paths_child.length) {
    path_pre = `${path_pre}/${paths_child[i]}`;
    // console.log("xxx, path_start is : ", path_pre);
    const path_var_next = path_pre + "/" + name_file_variable;
    if (fs.existsSync(path_var_next)) {
      const var_next = parseJsonFile(path_var_next);
      res = merge(res, var_next);
    }
    i++;
  }
  return res;
};
const classifyFileAndDir = paths_cdd => {
  const directories = [];
  const markdowns = [];
  const jsons = [];
  paths_cdd.forEach(path_cdd => {
    const isMarkdownFile = path_cdd.indexOf(".md") === path_cdd.length - 3;
    const isJsonFile = path_cdd.indexOf(".json") === path_cdd.length - 5;
    if (_isDirectory(path_cdd)) {
      directories.push(path_cdd);
    } else if (isMarkdownFile) {
      markdowns.push(path_cdd);
    } else if (isJsonFile) {
      jsons.push(path_cdd);
    }
  });
  return { directories, markdowns, jsons };
};
const _parseFragment = (path_fragment, map_fragment = {}) => {
  const paths_child = getChildrenPath(path_fragment);
  const { directories, markdowns } = classifyFileAndDir(paths_child);
  if (markdowns.length) {
    markdowns.forEach(path_abs => {
      const content = fs.readFileSync(path_abs).toString();
      map_fragment[path_abs] = content;
    });
  }
  if (directories.length) {
    directories.forEach(d => {
      map_fragment = _parseFragment(d, map_fragment);
    });
  }
  return map_fragment;
};
const _getFragment = path_abs => {
  // get path
  const path_doc = `${path_dir_root}/${name_dir_from}/`;
  const lang = path_abs.split(path_doc)[1].split("/")[0];
  const path_fragment = `${path_dir_root}/${name_dir_from}/${lang}/${name_dir_fragment}`;
  // parse fragment
  return _parseFragment(path_fragment);
};
const _readFileToString = path_abs => {
  return fs.readFileSync(path_abs).toString() || "";
};
const _replaceFragment = (content, map_fragment, language) => {
  const regex = /\{\{fragment\/.{0,1000}\}\}/gi;
  const matches = content.match(regex);
  if (matches) {
    matches.forEach(name_dir_fragment => {
      const key = name_dir_fragment
        .split(" ")
        .join("")
        .slice(2, name_dir_fragment.length - 2);
      const path_abs = path.resolve(__dirname, name_dir_from, language, key);
      const content_f = map_fragment[path_abs];
      content = _replaceContent(name_dir_fragment, content_f, content);
    });
  }
  return content;
};
const writeFile = path_from => {
  const path_to = getTargetPath(path_from);
  const map_variable = _getVariable(path_from);
  const map_fragment = _getFragment(path_from);
  let content = _readFileToString(path_from);
  content = _replaceFragment(content, map_fragment, language);
  content = _replaceVariable(content, map_variable);
  fs.writeFileSync(path_to, content);
};

module.exports = {
  parseJsonFile,
  writeFile,
  classifyFileAndDir,

  _getFragment
};
