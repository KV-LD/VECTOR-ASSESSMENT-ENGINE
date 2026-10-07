const os = require('os');
const path = require('path');

process.env.STORAGE_DRIVER = process.env.STORAGE_DRIVER || 'excel';
process.env.VECTOR_DATA_FILE = process.env.VECTOR_DATA_FILE
  || path.join(os.tmpdir(), `vector-jest-${process.pid}.xlsx`);
process.env.PORT = process.env.PORT || '0';
