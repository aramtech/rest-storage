// @ts-nocheck
const create_storage = (await import("./storage.js")).default;
const multer = (await import("multer")).default;
const env = (await import("$/server/env.js")).default;
const fm = (await import("$/server/middlewares/file.middleware.js")).default;

/**
 *
 * @param {Number} limit
 * @param {Number} size
 * @returns {Object}
 * returns an object contains
 *   - "files", the maximum number of files (default 1)
 *   - "fileSize", maximum size of a single file in bytes (default 1MB)
 *
 */
var limits = (limit, size) => ({
    files: limit || 1,
    fileSize: size || 1024 * 1024,
});

/**
 * @functions
 * check if the pass files type satisfies one or several mimetypes required
 *
 * @param {String | Array<String> | null | undefined} mimetypes
 * @param {Object} file
 * @returns {Boolean}
 * validity of the file mimetype
 *
 * @process
 * - if mimetypes is an array then check if the array includes the file mimetype
 * - if the mimetypes is a string we check if it equals the file mimetype
 * - if no mimetypes then the return true
 *
 */
const mime_condition = (mimetypes, file) => {
    let mime_condition = false;
    if (typeof mimetypes == "object") {
        mimetypes = Object.values(mimetypes);
        mime_condition = mimetypes.length == 0 || mimetypes.includes(file?.mimetype);
    } else if (typeof mimetypes == "string") {
        mime_condition = mimetypes == file?.mimetype;
    } else if (!mimetypes) {
        mime_condition = true;
    }
    return mime_condition;
};

/**
 *
 * @param {String} field_name // multer field name selector
 * @param {Boolean} required // flag true or false
 * @param {Number} file_size // maximum file size in Bytes
 * @param {Array<String> | String} mimetypes // required mimetype of file
 * @param {Number} limit // maximum number of files
 * @returns {Array<Function>}
 * middleware stack to validate and save the files
 *
 * @example
 * file('profile_picture',true,1024*1024,["image/jpeg","image/jpg"],1)
 */
const file = (
    field_name,
    required,
    file_size,
    mimetypes,
    limit,
    storage_params = {
        prefix: undefined,
        date: undefined,
        filename: undefined,
        randoms: 2,
        suffix: undefined,
        directory: undefined,
    },
) => {
    return [
        multer({
            storage: create_storage(storage_params),
            fileFilter: (req, file, cb) => {
                if (mime_condition(mimetypes, file)) {
                    cb(null, true);
                } else {
                    const error = { error: { msg: "Required Field messing", name: "File Error" } };
                    error.status_code = env.response.status_codes.invalid_field;
                    cb(error, false);
                }
            },
            limits: {
                files: limit,
                fileSize: file_size,
            },
        }).array(field_name, limit),
        // make sure that the file is required or not
        async (request, response) => {
            if (!Object.values(request.files || {}).length && required) {
                const error = { error: { msg: `Required File Field messing ${field_name}`, name: "File Error" } };
                error.status_code = env.response.status_codes.invalid_field;
                throw error;
            } else {
                return;
            }
        },
        fm.register,
    ];
};

export default file;
