const process = require("process");
const fs = require("fs");
const merge = require("lodash/merge");
const { name_dir_from, name_file_variable } = require("../Consts");

const path_dir_root = process.cwd();

const parseJsonFile = path_abs => {
  return JSON.parse(fs.readFileSync(path_abs).toString() || "{}");
};
const getVariable = path_abs => {
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

const getFragment = path_abs => {};

module.exports = {
  parseJsonFile,
  getVariable,
  getFragment
};
