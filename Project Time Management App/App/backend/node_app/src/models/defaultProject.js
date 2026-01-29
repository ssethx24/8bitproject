import Project from "./Project.js";
#hello
export async function getDefaultProjectId() {
  let p = await Project.findOne({ name: "Default Project" });
  if (!p) p = await Project.create({ name: "Default Project" });
  return p._id;
}