import * as Yup from "yup";
import { Request, Response } from "express";
import multer from "multer";

// Define input field configuration
export const fieldsForDocument = [
  { name: "subject", label: "Subject", type: "text" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "comments", label: "Comments", type: "textarea" },
  {
    name: "folder",
    label: "Select Folder",
    type: "select",
    options: [
      { value: "folder1", label: "Folder 1" },
      { value: "folder2", label: "Folder 2" },
    ],
  },
  { name: "tags", label: "Add Tags", type: "text", placeholder: "#tag1, #tag2" },
  { name: "file", label: "Upload File", type: "file" },
  {
    name: "approver",
    label: "Set Approver",
    type: "select",
    options: [
      { value: "user1", label: "User 1" },
      { value: "user2", label: "User 2" },
    ],
  },
  {
    name: "selectedGroups",
    label: "Group Wise",
    type: "react-select",
    options: [
      { value: "group1", label: "Group 1" },
      { value: "group2", label: "Group 2" },
      { value: "group3", label: "Group 3" },
    ],
  },
  {
    name: "selectedUsers",
    label: "User Wise",
    type: "react-select",
    options: [
      { value: "user1", label: "User 1" },
      { value: "user2", label: "User 2" },
      { value: "user3", label: "User 3" },
    ],
  },
];

// Validation schema with Yup
export const validationSchemaForDocument = Yup.object({
  subject: Yup.string().required("Subject is required"),
  description: Yup.string().required("Description is required"),
  comments: Yup.string().required("Comments are required"),
  folder: Yup.string().required("Please select a folder"),
  tags: Yup.string().required("At least one tag is required"),
  approver: Yup.string().required("Approver selection is required"),
  selectedGroups: Yup.array().min(1, "Please select at least one group"),
  selectedUsers: Yup.array().min(1, "Please select at least one user"),
});

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Store files in 'uploads' folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage }).single('file'); // Handle file upload as a single field

// Controller function to handle document upload
export const uploadDocument = (req: Request, res: Response) => {
  upload(req, res, async (err: any) => {
    if (err) {
      return res.status(400).send({ error: err.message });
    }

    try {
      // Destructure input data from req.body
      const { selectedOption, subject, description, comments, folder, tags, approver, selectedGroups, selectedUsers } = req.body;

      // Validate the document data using Yup
      await validationSchemaForDocument.validate({
        subject,
        description,
        comments,
        folder,
        tags,
        approver,
        selectedGroups,
        selectedUsers,
      }, { abortEarly: false });

      // Log and handle the uploaded file if it exists
      if (req.file) {
        console.log("Uploaded file:", req.file);
      }

      // Response data including file name (or null if no file was uploaded)
      return res.status(200).json({
        message: 'Document uploaded successfully',
        data: {
          selectedOption,
          subject,
          description,
          comments,
          folder,
          tags,
          approver,
          selectedGroups,
          selectedUsers,
          file: req.file ? req.file.filename : null,  // File name or null
        },
      });
    } catch (validationError: any) {
      // Type assertion: validationError is an instance of Yup.ValidationError
      if (validationError instanceof Yup.ValidationError) {
        return res.status(400).json({ error: validationError.errors });
      } else {
        return res.status(500).json({ error: "Unknown error occurred" });
      }
    }
  });
};
