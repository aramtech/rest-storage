const archiver = await import("archiver");
const fs = (await import("fs")).default;
export const zip_directory = async (directory_path: string, target: string, subdir_name: false | string = false): Promise<true> => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("Creating Zip File", directory_path, target, subdir_name);
            const archive = archiver.default("zip");
            archive.on("warning", function (error) {
                if (error.code === "ENOENT") {
                    console.warn("Archive Warning", error);
                } else {
                    archive.end();
                    reject(error);
                }
            });
            archive.on("error", function (err) {
                console.error("Archive Error", err);
                archive.end();
                reject(err);
            });

            const output = fs.createWriteStream(target);
            
            archive.pipe(output);

            archive.directory(directory_path, subdir_name);
            console.log("Finalizing Archive");
            archive.finalize().catch(error=>{
                console.log("Archive finalize error", error)
            });
            archive.on("finish", () => {
                resolve(true);
            });
        } catch (error) {
            reject(error);
        }
    });
};
