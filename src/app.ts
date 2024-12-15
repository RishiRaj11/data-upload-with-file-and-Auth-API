import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
const port = 3000;

// Secret key for JWT (this should be kept secure in an environment variable in a real app)
const JWT_SECRET = 'your-secret-key';

// Dummy user store (in a real app, store users in a database)
let users: { email: string, password: string }[] = [];

// Middleware for authentication
const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  // Retrieve token from Authorization header (Bearer token)
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ error: 'Access Denied: No token provided.' });
    return;
  }

  // Verify the token using jwt
  jwt.verify(token, JWT_SECRET, (err) => {
    if (err) {
      res.status(403).json({ error: 'Access Denied: Invalid token.' });
      return;
    }
    next();  // Token is valid, proceed to the next middleware or route
  });
};

// Ensure that the 'uploads' directory exists, and create it if not
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath);
}

// Set up Multer storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure the destination folder is the 'uploads' directory
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    // Naming the file uniquely using timestamp and original name
    const fileName = Date.now() + '-' + file.originalname;
    cb(null, fileName);
  }
});

// Set up multer instance for file upload
const upload = multer({ storage });

// Middleware for JSON parsing and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsPath)); // Serve uploaded files from the 'uploads' folder

// API endpoint for user registration (signup)
app.post('/api/signup', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  // Simple email/password validation (you can add more robust checks)
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  // Hash the password before storing
  const hashedPassword = await bcrypt.hash(password, 10);

  // Add user to our "users" array (in a real app, this should go to a database)
  users.push({ email, password: hashedPassword });

  res.status(201).json({ message: 'User created successfully.' });
});

// API endpoint for user login (returns JWT token)
app.post('/api/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  // Find user in the "users" array (in a real app, this should query a database)
  const user = users.find(u => u.email === email);

  if (!user) {
    res.status(400).json({ error: 'Invalid email or password.' });
    return;
  }

  // Verify the password
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    res.status(400).json({ error: 'Invalid email or password.' });
    return;
  }

  // Generate JWT token (valid for 1 hour)
  const token = jwt.sign({ userId: user.email }, JWT_SECRET, { expiresIn: '1h' });

  res.status(200).json({ token });
});

// API endpoint for document upload using multer
app.post('/api/upload', authenticateToken, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  // Check if a file is uploaded
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded.' });
    return;
  }

  // You can access other form fields via req.body
  const { subject, description, tags, folder, approver, selectedGroups, selectedUsers } = req.body;

  // Validate other fields (this can be customized for more fields)
  if (!subject || !description || !tags || !folder || !approver || !selectedGroups || !selectedUsers) {
    res.status(400).json({ error: 'All fields (subject, description, tags, folder, approver, selectedGroups, selectedUsers) are required.' });
    return;
  }

  // Response includes the uploaded file and all the fields
  res.status(200).json({
    message: 'File uploaded successfully.',
    data: {
      subject,
      description,
      tags,
      folder,
      approver,
      selectedGroups,
      selectedUsers,
      file: {
        filename: req.file.filename,        // The filename stored on the server
        path: req.file.path,                // Path to the uploaded file
        size: req.file.size,                // File size in bytes
        mimetype: req.file.mimetype        // MIME type of the uploaded file
      }
    }
  });
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
