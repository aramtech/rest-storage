const multer = (await import("multer")).default;
const moment = (await import("moment")).default;
const path = (await import("path")).default;

import { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import create_logger from "$/server/utils/log/index.js";
const log = await create_logger("create storage for multer middleware");
const mime_types = (await import("mime-types")).default;

function randoms(n = 2) {
    let return_string = "";
    for (let i = 0; i < 2; i++) {
        return_string += String(Math.floor(Math.random() * 10));
    }
    return return_string;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
/**
 * @description
 * storage is the multer storage utility, specifies
 *  - the callback for creating file name
 *  - the callback for specifying storage directory (public)
 *
 */
const create_storage = function (params = {}) {
    let save_path = path.join(__dirname, "../../public/uploads");
    if (params.directory) {
        save_path = path.join(save_path, params.directory);
    }
    fs.mkdirSync(save_path, {
        recursive: true,
    });
    const final_save_path = save_path;
    const storage = multer.diskStorage({
        destination: async function (req, file, cb) {
            cb(null, final_save_path);
        },
        filename: function (req, file, cb) {
            if (params.filename) {
                return cb(null, params.filename);
            }
            let date = params.date || moment().toISOString().replace(/\-/g, "_").replace(/:/g, "-").replace(".", "-");
            let name =
                (params.prefix || file.fieldname) +
                "_" +
                (params.randoms === 0 ? "" : randoms(parseInt(params.randoms) || 2) + "_") +
                date +
                "." +
                (mime_types.extension(file.mimetype) || params.suffix || file.mimetype.split("/")[1]);
            return cb(null, name);
        },
    });
    return storage;
};

export default create_storage;
