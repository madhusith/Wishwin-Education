const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isPdfExt = ext === '.pdf';
  const isPdfMime = file.mimetype === 'application/pdf' || file.mimetype === 'application/x-pdf';

  if (isPdfExt || isPdfMime) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF documents (.pdf) are allowed in Phase 1.'), false);
  }
};

const uploadPdf = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB max limit
  },
});

const receiptFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/x-pdf',
  ];

  if (allowedExts.includes(ext) || allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Please upload an image (JPG, PNG, WEBP) or PDF of your receipt.'), false);
  }
};

const uploadReceipt = multer({
  storage,
  fileFilter: receiptFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max for receipts
  },
});

module.exports = {
  uploadPdf,
  uploadReceipt,
};
