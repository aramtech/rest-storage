const file = (await import("./file.js")).default;

const file_size = 1024 * 1024;
const files_limit = 1;

const jpg = (field_name, required, size = file_size, limit = files_limit) => file(field_name, required, size, ["image/jpeg", "image/jpg"], limit);

const jpg_png = (field_name, required, size = file_size, limit = files_limit) =>
    file(field_name, required, size, ["image/jpeg", "image/jpg", "image/png"], limit);

const png = (field_name, required, size = file_size, limit = files_limit) => file(field_name, required, size, ["image/png"], limit);

export default {
    jpg,
    jpg_png,
    png,
};
