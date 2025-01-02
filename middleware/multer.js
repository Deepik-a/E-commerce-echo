const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + `-${file.originalname}`);
    }
});

const uploads = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB size limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/; // Allowed file types
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(null, false); // Instead of throwing an error, reject the file
    }
});

// Multer upload handler (limit 3 files)
const multerUpload = uploads.array('newImages', 10);

module.exports = multerUpload;



// ==================
// Multer Setup for File Uploads
// ==================

// const multer = require('multer');
//  const path = require('path');

// // Configure storage settings
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, path.join(__dirname, '../uploads')); // Directory to save uploaded images
//     },
//     filename: function (req, file, cb) {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         //         cb(null, uniqueSuffix + `-${file.originalname}`); // Create unique file name using timestamp
//     }
// });

// // Initialize multer with specified storage settings
// const uploads = multer({ storage: storage });

// module.exports = uploads.array('newImages', 10); // Allows up to 10 files with 'newImages' as the field name