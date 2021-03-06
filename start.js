const merge = require("lodash/merge");
const fs = require("fs");
const process = require("process");
const path = require("path");
const chokidar = require("chokidar");
const {
  dir_filtered,
  all_filtered,
  name_dir_from,
  name_dir_to,
  name_dir_fragment,
  name_file_variable,
  name_file_template
} = require("./src/Consts");
const {
  writeFile,
  classifyFileAndDir,
  getLanguage,
  replaceFragment,
  replaceContent,
  fileToString
} = require("./src/helpers/File");
const { getChildrenPath, getTargetPath } = require("./src/helpers/Path");
const path_dir_root = process.cwd();

const _isFilteredChild = path_abs => {
  return dir_filtered.some(name_d => {
    const str = `\/${name_d}\/`;
    const regex = new RegExp(str, "i");
    return regex.test(path_abs);
  });
};
const _isFiltered = path_abs => {
  const self_filtered = all_filtered.some(name_f => {
    let reg_self;
    if (name_f.indexOf(".") !== -1) {
      const [left, right] = name_f.split(".");
      reg_self = `/${left}\\.${right}$/`;
    } else {
      reg_self = `\/${name_f}\$`;
    }
    const regex = new RegExp(reg_self, "i");
    return regex.test(path_abs);
  });
  return self_filtered || _isFilteredChild(path_abs);
};

const _getAbsPath = (father, child) => `${father}/${child}`;

const _parseFromToTargetPath = path_from => {
  const arr = path_from.split(__dirname);
  let target_rel = arr[1].replace(name_dir_from, name_dir_to);
  target_rel = target_rel.slice(1, target_rel.length);
  return path.resolve(__dirname, target_rel);
};
const _copyDir = path_from => {
  if (_isFiltered(path_from)) {
    return false;
  }
  const target = _parseFromToTargetPath(path_from);
  const should_copy_this = !fs.existsSync(target);
  if (should_copy_this) {
    fs.mkdirSync(target);
  }
  const children = getChildrenPath(path_from) || [];
  const { directories } = classifyFileAndDir(children);
  if (directories.length) {
    directories.forEach(d => {
      _copyDir(d);
    });
  }
};

const _getVersion = () => {
  return `v${
    JSON.parse(fileToString(path.resolve(__dirname, "version.json"))).version
  }`;
};

const _getTargetPathFromJson = path_abs => {
  path_abs = path_abs.replace(name_dir_from, name_dir_to);
  return path_abs.slice(0, path_abs.length - 4) + "md";
};
const _replaceVariable = (content = "", variable) => {
  const regex = /\{\{var\..{0,1000}\}\}/gi;
  const matches = content.match(regex);
  if (matches) {
    // console.log(matches);
    matches.forEach(name_dir_fragment => {
      const keyChain = name_dir_fragment
        .split(" ")
        .join("")
        .slice(2, name_dir_fragment.length - 2)
        .split(".");
      keyChain.shift();
      let target = variable[keyChain[0]];
      let i = 1;
      while (i < keyChain.length) {
        target = target[key];
        i++;
      }
      content = replaceContent(name_dir_fragment, target, content);
      // console.log(content);
    });
  }
  return content;
};
const _replaceTab = (content = "", tabLinks) => {
  const tabRegx = /\{\{tab\}\}/i;
  const html = `<div>${Object.keys(tabLinks)
    .map(key => {
      return `<a href="${tabLinks[key]}">${key}</a>`;
    })
    .join("")}</div>`;
  return content.replace(tabRegx, html);
};
const _reWriteFile = (path_from, map_fragment, map_variable) => {
  let content = fileToString(path_from);
  const language = getLanguage(path_from);
  content = replaceFragment(content, map_fragment, language);
  content = _replaceVariable(content, map_variable);
  const path_to = getTargetPath(path_from);
  return fs.writeFileSync(path_to, content);
};
const _genPageFromTemplate = (
  path_jsonFile,
  path_template,
  map_fragment,
  map_variable,
  tabLinks
) => {
  // console.log("xxx", path_jsonFile, path_template);
  const language = path_jsonFile
    .split(`${__dirname}/${name_dir_from}/`)[1]
    .split("/")[0];
  let content = fileToString(path_template);
  // replace fragment
  content = replaceFragment(content, map_fragment, language);
  // replace var
  const var_json = JSON.parse(fileToString(path_jsonFile));
  map_variable = merge(map_variable, var_json);
  content = _replaceVariable(content, map_variable);
  // replace tab
  content = _replaceTab(content, tabLinks);
  // console.log(content);
  const path_target = _getTargetPathFromJson(path_jsonFile);
  return fs.writeFileSync(path_target, content);
};
const _parseFragment = (path_fragment, map_fragment = {}) => {
  const res = getChildrenPath(path_fragment) || [];
  const { directories, markdowns } = classifyFileAndDir(res);
  if (markdowns.length) {
    markdowns.forEach(path_abs => {
      const content = fs.readFileSync(path_abs).toString();
      // console.log('xxx',content);
      map_fragment[path_abs] = content;
    });
  }
  if (directories.length) {
    directories.forEach(d => {
      map_fragment = _parseFragment(d, map_fragment);
    });
  }
  // console.log(JSON.stringify(map_fragment));
  return map_fragment;
};
const _parseVariable = (path_abs, map_variable = {}) => {
  const obj = JSON.parse(fs.readFileSync(path_abs).toString());
  // console.log({ ...map_variable, ...obj});
  return merge(map_variable, obj);
};
function convert(target, map_fragment = {}, map_variable = {}) {
  // 获取目录[fragment, variable, ....]
  const res = fs.readdirSync(target) || [];
  // console.log(target, res)
  const targets = [];
  let fragmentFolder, variableFile, template;
  res.forEach(name => {
    const isContent = name !== name_dir_fragment && name !== name_file_variable;
    if (isContent) {
      targets.push(_getAbsPath(target, name));
    }
    if (name === name_dir_fragment) {
      fragmentFolder = name;
    }
    if (name === name_file_variable) {
      variableFile = name;
    }
    if (name === name_file_template) {
      template = name;
    }
  });
  // console.log(targets)
  const { directories, markdowns, jsons } = classifyFileAndDir(targets);
  // 获取fragment和顶部变量,开始遍历和替换
  if (!!fragmentFolder) {
    map_fragment = _parseFragment(
      _getAbsPath(target, fragmentFolder),
      map_fragment
    );
  }
  if (!!variableFile) {
    map_variable = _parseVariable(
      _getAbsPath(target, variableFile),
      map_variable
    );
  }
  // rewrite file or generate file with template
  if (template) {
    const path_template = _getAbsPath(target, template);
    const version = _getVersion();
    const tabLinks = {};
    // console.log(jsons);
    jsons.forEach(path_jsonFile => {
      path_jsonFile = path_jsonFile.split(
        path.resolve(__dirname, name_dir_from)
      )[1];
      const arr = path_jsonFile.split("/");
      const key = arr[arr.length - 1].split(".json")[0];
      arr.splice(1, 0, version);
      let _path = arr.join("/");
      _path = _path.slice(0, _path.length - 4) + "md";
      tabLinks[key] = _path;
    });
    // console.log(tabLinks);
    jsons.forEach(path_jsonFile => {
      _genPageFromTemplate(
        path_jsonFile,
        path_template,
        map_fragment,
        map_variable,
        tabLinks
      );
    });
  } else {
    markdowns.forEach(file => {
      _reWriteFile(file, map_fragment, map_variable);
    });
  }
  // rewrite directories
  directories.forEach(directory => {
    convert(directory, map_fragment, map_variable);
  });
}

const initialScan = () => {
  const path_from = path.resolve(__dirname, `${name_dir_from}/`);
  console.log(`Documents convention Start`);
  const res = fs.readdirSync(path_from) || [];
  const sites_next = res.map(item => _getAbsPath(path_from, item));
  if (sites_next.length) {
    _copyDir(path_from);
    return;
    sites_next.forEach(path_lang => {
      convert(path_lang);
    });
    console.log(`Documents convention Finished, '\n' , '\n' , '\n' , '\n' `);
    // });
  } else {
    console.warn(`Documents is Empty`);
  }
};
const onFileAdd = path_from => {
  if (!_isFiltered(path_from)) {
    writeFile(path_from);
  }
};
const onFileRemove = path_from => {
  const path_target = getTargetPath(path_from);
  if (fs.existsSync(path_target)) {
    fs.unlinkSync(path_target);
  }
};
const onAddDir = path_from => {
  if (!_isFiltered(path_from)) {
    const path_target = getTargetPath(path_from);
    !fs.existsSync(path_target) && fs.mkdirSync(path_target);
  }
};
const _rmDir = path_target => {
  if (fs.existsSync(path_target)) {
    let files = fs.readdirSync(path_target);
    for (var i = 0; i < files.length; i++) {
      let newPath = path.join(path_target, files[i]);
      let stat = fs.statSync(newPath);
      if (stat && !stat.isDirectory()) {
        fs.unlinkSync(newPath);
      } else {
        _rmDir(newPath);
      }
    }
    fs.rmdirSync(path_target);
  }
};
const onDirRemove = path_from => {
  const path_target = getTargetPath(path_from);
  // console.log("xxx", path_from, path_target, "\n", "\n", "\n");
  _rmDir(path_target);
};
const startWatch = () => {
  const watcher = chokidar.watch(
    path.resolve(path_dir_root, `${name_dir_from}/`)
  );
  watcher
    .on("ready", initialScan)
    .on("add", onFileAdd)
    .on("change", onFileAdd)
    .on("unlink", onFileRemove)
    .on("addDir", onAddDir)
    .on("unlinkDir", onDirRemove);
};
startWatch();

/**
 * DONE:
 * - 支持全局变量,局部变量
 * - 支持markdown片段
 * - 支持tab标签
 * - 源文件监控, 目标文件自动生成
 * - 不相关的文件不要移动和复制
 * - Readme
 * - 新增/删除/改动哪个文件 就更改哪个文件及其关联文件,不要全局改动;
 * - fragment in fragment
 * - bash in src, markdown in doc
 *  - split helper
 * - 目前fragment会被遍历多次, 如确认每个folder有且仅有一个fragent根目录, 记得修改;
 * TODO:
 * - variable in .md (top)
 *
 * - testcase
 * - move ignore, fragment, template to .docignore in root
 * - tab标签属于非标准功能, 移除,之后用注册的方式加入
 *
 */
