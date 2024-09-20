// @ts-nocheck
const fs = (await import("fs")).default;
const { dirname, join } = (await import("path")).default;
const { fileURLToPath } = (await import("url")).default;

const client = (await import("$/server/database/prisma.ts")).default;

import path from "path";
import url from "url";
import env_obj from "../../env.js";
import ObjectError from "../ObjectError/index.js";

const src_path = path.resolve(path.join(path.dirname(url.fileURLToPath(import.meta.url)), "../../."));

/**
 * (*) means required
 * @typedef {Object} File
 * @property {Buffer|string} data - *the data to be saved (the only option required)
 * @property {string} [mimetype]  - data mimetype
 * @property {string} [static_dir] static directory key specified in env map
 * @property {string} [dir]  - directory to save to under public
 * @property {string} [name]  - file name
 * @property {string} [path] - full path to save to instead of a directory under public
 */

/**
 * @typedef {Object} ReturnFile
 * @property {Buffer|string} data - original file data
 * @property {Buffer} buffer - "data" converted or proxied as buffer
 * @property {string} mimetype  - mimetype saved under
 * @property {string} dir  - directory to save to under static directory key specified in env map
 * @property {string} static_dir static directory key specified in env map
 * @property {string} name  - file name
 * @property {string} path - full path to saved file
 * @property {boolean} saved - saved the file or not
 */

/**
 * @typedef {Object} Options
 * @property {Array<File>|Options} files // list of files each has data to be saved
 * @property {string} [dir] // the directory where to save all given files under static directory key specified in env map folder
 * @property {string} [name_prefix] // name prefix to use on all given files
 * @property {string} [static_dir] static directory key specified in env map
 * @property {string} [mimetype] // mimetype to use on all given files
 * @property {string} [file_extension] // file extension of all given files
 * @property {string} [user_id] // the creator of all given files
 * @property {boolean} [overwrite] // overwrite original if exists
 * @property {boolean} [recursive] // use recursive folder creation or not on all given files
 */

/**
 *
 * used to save files as a programmatic api
 *
 * @param {Array<File>|Options} files // list of files each has data to be saved
 * @param {string} dir // the directory where to save all given files under public folder
 * @param {string} name_prefix // name prefix to use on all given files
 * @param {string} mimetype // mimetype to use on all given files
 * @param {string} file_extension // file extension of all given files
 * @param {string} static_dir static directory key specified in env map
 * @param {string} user_id // the creator of all given files
 * @param {boolean} recursive // use recursive folder creation or not on all given files
 * @param {boolean} overwrite // overwrite original if exists
 * @returns {Promise<Array<ReturnFile>>} gives output of Array
 *
 *
 * each returned file has
 *   - dir (under public dir)
 *   - data (raw data to be saved (any))
 *   - saved (boolean)
 *   - mimetype
 *   - name (full name)
 *   - path (full path)
 *   - buffer (data buffer)
 *   - size (bytes)
 *   - user_id (creator)
 *
 * @example
 *  const pdf_file = (await save({
 *          files:[{data:pdf_buffer}],
 *          dir:dir, // documents/pdf/
 *          name_prefix:name_prefix, // emails_
 *          mimetype:"application/pdf",
 *          file_extension:"pdf",
 *          user_id:user_id,
 *          recursive:true
 *          overwrite = false,
 *      }))[0] // saves one file returns array of length 1
 */
export default async function (
    files,
    dir = "",
    name_prefix = "_",
    mimetype = "text/plain",
    file_extension = ".txt",
    user_id = 1,
    recursive = true,
    overwrite = false,
    static_dir = "public",
) {
    /*
     *
     * takes input of
     *
     *
     * - params
     *   - files // list of files each has data to be saved
     *   - dir // the directory where to save all given files under static directory key specified in env map folder
     *   - name_prefix // name prefix to use on all given files
     *   - mimetype // mimetype to use on all given files
     *   - file_extension // file extension of all given files
     *   - user_id // the creator of all given files
     *   - recursive // use recursive folder creation or not on all given files
     *
     *
     */

    if (arguments.length == 1) {
        const params = files;
        dir = params.dir || dir; // the directory where to save all given files under static directory key specified in env map folder
        name_prefix = params.name_prefix || name_prefix; // name prefix to use on all given files
        mimetype = params.mimetype || mimetype; // mimetype to use on all given files
        file_extension = params.file_extension || file_extension; // file extension of all given files
        user_id = params.user_id || user_id; // the creator of all given files
        recursive = params.recursive || recursive; // use recursive folder creation or not on all given files
        files = params.files || []; // all given files
        overwrite = params.overwrite || overwrite;
        static_dir = params.static_dir || static_dir || "public";
    }
    const static_directory_descriptor = env_obj.public_dirs.find((d) => {
        return d.local == static_dir;
    });
    if (!static_directory_descriptor) {
        throw new ObjectError({
            status_code: env_obj.response.status_codes.server_error,
            error: {
                msg: "invalid static directory for saving file",
                static_dir,
                available: env_obj.public_dirs,
            },
        });
    }

    const saved_files = []; // all saved files
    for (const file of files) {
        file.saved = false;
        try {
            file.dir || (file.dir = dir); // the directory where to save given file under static directory key specified in env map folder
            file.mimetype || (file.mimetype = mimetype); // mimetype to use on given file
            file.name ||
                (file.name = `${name_prefix}_${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}_${new Date().toISOstring()}.${
                    file.file_extension || file_extension || file.mimetype.split("/")[1]
                }`); // file full name formed of name_prefix, 2 random numbers, and iso_timestamp, and file extension
            file.path || (file.path = join(src_path, static_dir, file.dir, file.name)); // full path of file formed of server folder path, directory, file full name
            const buffer = Buffer.from(file.data || "");
            file.buffer = buffer; // data buffer
            file.size = buffer.length || Number.isNaN(parseInt(file.size)) ? 0 : parseInt(file.size); // file size from data buffer
            file.user_id = file.user_id || user_id; // creator id

            const unique = await client.files.findFirst({
                where: {
                    path: file.path,
                },
            });

            if (unique && !overwrite) {
                throw {
                    error: {
                        name: "file registration error",
                        msg: "file path is not unique",
                    },
                    status_code: env.response.status_codes.repeated_query,
                };
            }
            file.data &&
                recursive &&
                fs.mkdirSync(file.path.split("/").slice(0, -1).join("/"), {
                    recursive: true,
                }); // create nested dir under public folder if not exists if data and recursive
            file.data && fs.writeFileSync(file.path, buffer); // write file to full path if data
            file.user_id = Number(file.user_id)
            if (!unique) {
                await client.files.create({
                    data: {
                        name: file.name,
                        mimetype: file.mimetype,
                        size: file.size,
                        path: file.path,
                        created_at: new Date(),
                        updated_at: new Date(),
                        deleted: false,
                        created_by_user: !file.user_id
                            ? undefined
                            : {
                                  connect: {
                                      user_id: Number(file.user_id),
                                  },
                              },
                        updated_by_user: !file.user_id
                            ? undefined
                            : {
                                  connect: {
                                      user_id: file.user_id,
                                  },
                              },
                    },
                });
            } else {
                await client.files.update({
                    where: {
                        file_id: unique.file_id,
                    },
                    data: {
                        name: file.name,
                        mimetype: file.mimetype,
                        size: file.size,
                        path: file.path,
                        updated_at: new Date(),
                        deleted: false,
                        updated_by_user: !file.user_id
                            ? undefined
                            : {
                                  connect: {
                                      user_id: file.user_id,
                                  },
                              },
                    },
                });
            }
            file.data && (file.saved = true); // set saved file to true if data
            saved_files.push(file);
        } catch (error) {
            console.log(error);
            file.data && file.saved && fs.rmSync(file.path);
        }
    }
    /*
     * gives output of
     *
     *
     * each returned file has
     *   - dir (under static directory key specified in env map dir)
     *   - data (raw data to be saved (any))
     *   - saved (boolean)
     *   - mimetype
     *   - name (full name)
     *   - path (full path)
     *   - buffer (data buffer)
     *   - size (bytes)
     *   - user_id (creator)
     */
    return saved_files;
}
