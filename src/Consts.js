const name_dir_fragment = "fragment";
const name_file_variable = "variables.json";
const name_file_template = "template.md";

const file_filtered = [name_file_variable, name_file_template];
const dir_filtered = [name_dir_fragment];
const all_filtered = [...file_filtered, dir_filtered];

const name_dir_from = "doc";
const name_dir_to = "site";

module.exports = {
  file_filtered,
  dir_filtered,
  all_filtered,
  name_dir_from,
  name_dir_to,
  name_file_variable,
  name_dir_fragment
};
