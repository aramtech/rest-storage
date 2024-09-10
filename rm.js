// @ts-nocheck
const fs = (await import("fs")).default;

const client = (await import("$/server/database/prisma.ts")).default;
/**
 * @explanation
 * remove on file record identified either by its id (number) in database record or
 * by its full path (string) in database record
 *
 * @param {Number | String } file
 * @returns {Promise<undefined>}
 */
const rm_one = async (file) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (typeof file == "number") {
                // find
                const file_id = file;
                const file_record = await client.files.findFirst({
                    where: {
                        file_id: file_id,
                    },
                });
                if (!file_record) {
                    console.log("File not Found", file_id);
                } else {
                    fs.rmSync(file_record.path);
                    await client.files.update({
                        where: {
                            file_id: file_record.file_id,
                        },
                        data: {
                            deleted: true,
                        },
                    });
                }
            } else {
                const file_path = file;
                const file_record = await client.files.findFirst({
                    where: {
                        path: String(file_path).trim(),
                    },
                });
                if (!file_record) {
                    console.log("File not Found", String(file_path));
                } else {
                    fs.rmSync(file_record.path);
                    await client.files.update({
                        where: {
                            file_id: file_record.file_id,
                        },
                        data: {
                            deleted: true,
                        },
                    });
                }
            }
        } catch (error) {
            reject(error);
        }
    });
};
export default {
    one: rm_one,

    /**
     *
     * @param {import("fastify").FastifyRequest} request
     * @returns {undefined}
     *
     * @explanation
     * delete all files received with a request and saved by multer
     *
     *
     */
    array: async (request) => {
        return new Promise(async (resolve, reject) => {
            if (request.isFile) {
                for (const file of request.saved_files) {
                    try {
                        await rm_one(file.path);
                    } catch (error) {
                        console.log(error.message);
                    }
                }
                resolve();
            } else {
                resolve();
            }
        });
    },
};
